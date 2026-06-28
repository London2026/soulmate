import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBillingReminderSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'

const PLAN_AMOUNTS: Record<string, string> = {
  premium: '19.99',
  gold:    '39.99',
  elite:   '69.99',
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch all paid subscribers with a phone number
  const { data: subscribers, error } = await admin
    .from('profiles')
    .select('id, full_name, phone, subscription_tier')
    .in('subscription_tier', ['premium', 'gold', 'elite'])
    .not('phone', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  for (const sub of subscribers ?? []) {
    const amount = PLAN_AMOUNTS[sub.subscription_tier] ?? '0'
    try {
      await sendBillingReminderSMS(
        sub.phone,
        firstNameOnly(sub.full_name ?? ''),
        sub.subscription_tier,
        amount,
      )
      sent++
    } catch {
      // Log but continue for remaining subscribers
      console.error(`Billing SMS failed for ${sub.id}`)
    }
  }

  return NextResponse.json({ sent, total: subscribers?.length ?? 0 })
}

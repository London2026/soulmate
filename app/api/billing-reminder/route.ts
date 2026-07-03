import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBillingReminderSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'

const PLAN_AMOUNTS: Record<string, string> = {
  starter:  '6',
  standard: '9',
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
    .select('id, full_name, phone, plan')
    .in('plan', ['starter', 'standard'])
    .not('phone', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  for (const sub of subscribers ?? []) {
    const plan = (sub as Record<string, unknown>).plan as string
    const amount = PLAN_AMOUNTS[plan] ?? '0'
    try {
      await sendBillingReminderSMS(
        sub.phone,
        firstNameOnly(sub.full_name ?? ''),
        plan,
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

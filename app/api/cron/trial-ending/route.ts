import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrialEndingSoonEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'

const TRIAL_LENGTH_DAYS = 30
const REMIND_DAYS_BEFORE_END = 5 // send when 5 days of the trial remain

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const daysSinceCreationAtReminder = TRIAL_LENGTH_DAYS - REMIND_DAYS_BEFORE_END
  const now = Date.now()
  const windowStart = new Date(now - (daysSinceCreationAtReminder + 1) * 86400000)
  const windowEnd = new Date(now - daysSinceCreationAtReminder * 86400000)

  // Free-plan members whose trial started 25 days ago (a 24h window so each
  // profile is only ever caught by one daily run) and who completed onboarding
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('plan', 'free')
    .eq('onboarding_complete', true)
    .gte('created_at', windowStart.toISOString())
    .lt('created_at', windowEnd.toISOString())

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById: Record<string, string> = {}
  for (const u of users) if (u.email) emailById[u.id] = u.email

  let sent = 0
  for (const profile of profiles) {
    const email = emailById[profile.id]
    if (email) {
      await sendTrialEndingSoonEmail(email, firstNameOnly(profile.full_name ?? ''), REMIND_DAYS_BEFORE_END, profile.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}

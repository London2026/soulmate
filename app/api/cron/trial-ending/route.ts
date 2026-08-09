import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrialEndingSoonEmail, sendTrialEndedEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'
import { TRIAL_LENGTH_DAYS } from '@/lib/trial'

const REMIND_DAYS_BEFORE_END = 5 // send when 5 days of the trial remain

function dayWindow(daysSinceCreation: number, now: number) {
  return {
    windowStart: new Date(now - (daysSinceCreation + 1) * 86400000),
    windowEnd: new Date(now - daysSinceCreation * 86400000),
  }
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = Date.now()

  // Free-plan members whose trial started N days ago (a 24h window so each
  // profile is only ever caught by one daily run) and who completed onboarding
  const soonWindow = dayWindow(TRIAL_LENGTH_DAYS - REMIND_DAYS_BEFORE_END, now)
  // isTrialExpired() (lib/trial.ts) only flips to true once daysSinceCreation > TRIAL_LENGTH_DAYS,
  // so the "ended" email fires the same day the gating actually starts, not a day early.
  const endedWindow = dayWindow(TRIAL_LENGTH_DAYS + 1, now)

  const [{ data: endingSoonProfiles }, { data: justEndedProfiles }] = await Promise.all([
    admin.from('profiles').select('id, full_name')
      .eq('plan', 'free').eq('onboarding_complete', true)
      .gte('created_at', soonWindow.windowStart.toISOString())
      .lt('created_at', soonWindow.windowEnd.toISOString()),
    admin.from('profiles').select('id, full_name')
      .eq('plan', 'free').eq('onboarding_complete', true)
      .gte('created_at', endedWindow.windowStart.toISOString())
      .lt('created_at', endedWindow.windowEnd.toISOString()),
  ])

  if (!endingSoonProfiles?.length && !justEndedProfiles?.length) return NextResponse.json({ sent: 0 })

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById: Record<string, string> = {}
  for (const u of users) if (u.email) emailById[u.id] = u.email

  let sent = 0
  for (const profile of endingSoonProfiles ?? []) {
    const email = emailById[profile.id]
    if (email) {
      await sendTrialEndingSoonEmail(email, firstNameOnly(profile.full_name ?? ''), REMIND_DAYS_BEFORE_END, profile.id)
      sent++
    }
  }
  for (const profile of justEndedProfiles ?? []) {
    const email = emailById[profile.id]
    if (email) {
      await sendTrialEndedEmail(email, firstNameOnly(profile.full_name ?? ''), profile.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}

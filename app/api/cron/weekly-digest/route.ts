import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyDigestEmail } from '@/lib/sendEmail'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [membersRes, revealsRes, newMembersRes] = await Promise.all([
    admin.from('profiles')
      .select('id, full_name, country, email_unsubscribed')
      .eq('onboarding_complete', true),
    admin.from('photo_reveals')
      .select('viewed_id')
      .gte('revealed_at', weekAgo.toISOString()),
    admin.from('profiles')
      .select('country')
      .eq('onboarding_complete', true)
      .gte('created_at', weekAgo.toISOString()),
  ])

  const members = membersRes.data ?? []

  // Views per member this week
  const viewsByMember: Record<string, number> = {}
  for (const r of revealsRes.data ?? []) {
    viewsByMember[r.viewed_id] = (viewsByMember[r.viewed_id] ?? 0) + 1
  }

  // New members this week by country
  const newByCountry: Record<string, number> = {}
  for (const m of newMembersRes.data ?? []) {
    if (m.country) newByCountry[m.country] = (newByCountry[m.country] ?? 0) + 1
  }

  // Batch-fetch auth users for emails
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById: Record<string, string> = {}
  for (const u of users) if (u.email) emailById[u.id] = u.email

  let sent = 0
  for (const member of members) {
    if ((member as Record<string, unknown>).email_unsubscribed === true) continue

    const views = viewsByMember[member.id] ?? 0
    const newNearby = member.country ? ((newByCountry[member.country] ?? 0)) : 0

    // Subtract 1 from newNearby if this member themselves joined this week
    const adjustedNewNearby = Math.max(0, newNearby)

    const email = emailById[member.id]
    if (!email) continue

    await sendWeeklyDigestEmail(
      email,
      member.full_name?.split(' ')[0] ?? 'there',
      views,
      adjustedNewNearby,
      member.country ?? 'your area',
      member.id,
    )
    sent++
  }

  return NextResponse.json({ sent })
}

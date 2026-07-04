import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEncouragementEmail } from '@/lib/sendEmail'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const h72ago = new Date(now.getTime() - 72 * 60 * 60 * 1000)

  // Profiles created 24–72h ago that haven't completed onboarding
  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('onboarding_complete', false)
    .lte('created_at', h24ago.toISOString())
    .gte('created_at', h72ago.toISOString())

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  // Batch-fetch auth users
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById: Record<string, string> = {}
  for (const u of users) if (u.email) emailById[u.id] = u.email

  let sent = 0
  for (const profile of profiles) {
    const email = emailById[profile.id]
    if (email) {
      await sendEncouragementEmail(email, profile.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}

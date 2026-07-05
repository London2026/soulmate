import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMeetingFeedbackEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()

  // Target: accepted meetings whose preferred_date was 24–48h ago, feedback not yet requested
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: meetings } = await admin
    .from('video_meetings')
    .select('id, requester_id, recipient_id, preferred_date')
    .eq('status', 'accepted')
    .eq('feedback_requested', false)
    .gte('preferred_date', twoDaysAgo)
    .lte('preferred_date', yesterday)

  if (!meetings?.length) return Response.json({ sent: 0 })

  let sent = 0
  for (const meeting of meetings) {
    const [{ data: reqProfile }, { data: recProfile }, { data: reqAuth }, { data: recAuth }] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', meeting.requester_id).single(),
      admin.from('profiles').select('full_name').eq('id', meeting.recipient_id).single(),
      admin.auth.admin.getUserById(meeting.requester_id),
      admin.auth.admin.getUserById(meeting.recipient_id),
    ])

    const reqEmail = reqAuth?.user?.email
    const recEmail = recAuth?.user?.email
    const reqName = reqProfile?.full_name ?? ''
    const recName = recProfile?.full_name ?? ''

    await Promise.all([
      reqEmail
        ? sendMeetingFeedbackEmail(reqEmail, firstNameOnly(reqName), firstNameOnly(recName), meeting.id, meeting.requester_id)
        : Promise.resolve(),
      recEmail
        ? sendMeetingFeedbackEmail(recEmail, firstNameOnly(recName), firstNameOnly(reqName), meeting.id, meeting.recipient_id)
        : Promise.resolve(),
    ])

    await admin.from('video_meetings').update({ feedback_requested: true }).eq('id', meeting.id)
    sent++
  }

  return Response.json({ sent })
}

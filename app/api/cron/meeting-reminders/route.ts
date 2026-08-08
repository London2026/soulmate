import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMeetingReminderEmail } from '@/lib/sendEmail'
import { sendMeetingReminderSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'
import { countryToTimezone, formatInTimezone } from '@/lib/timezone'

// Wide windows (not exact-minute matches) so this stays correct regardless of
// how often the cron actually fires.
const WINDOW_60 = { minMinutes: 50, maxMinutes: 70 }
const WINDOW_15 = { minMinutes: 8, maxMinutes: 22 }

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const horizon = new Date(now + WINDOW_60.maxMinutes * 60000).toISOString()

  const { data: meetings } = await admin
    .from('video_meetings')
    .select('id, room_id, requester_id, recipient_id, meeting_at, reminder_60_sent, reminder_15_sent')
    .eq('status', 'accepted')
    .not('meeting_at', 'is', null)
    .gt('meeting_at', new Date(now).toISOString())
    .lt('meeting_at', horizon)
    .or('reminder_60_sent.eq.false,reminder_15_sent.eq.false')

  if (!meetings?.length) return Response.json({ sent: 0 })

  let sent = 0
  for (const meeting of meetings) {
    const minutesUntil = (new Date(meeting.meeting_at).getTime() - now) / 60000
    let minutesBefore: 60 | 15 | null = null
    if (!meeting.reminder_60_sent && minutesUntil >= WINDOW_60.minMinutes && minutesUntil <= WINDOW_60.maxMinutes) {
      minutesBefore = 60
    } else if (!meeting.reminder_15_sent && minutesUntil >= WINDOW_15.minMinutes && minutesUntil <= WINDOW_15.maxMinutes) {
      minutesBefore = 15
    }
    if (!minutesBefore) continue

    const [{ data: reqProfile }, { data: recProfile }, { data: reqAuth }, { data: recAuth }] = await Promise.all([
      admin.from('profiles').select('full_name, phone, country').eq('id', meeting.requester_id).single(),
      admin.from('profiles').select('full_name, phone, country').eq('id', meeting.recipient_id).single(),
      admin.auth.admin.getUserById(meeting.requester_id),
      admin.auth.admin.getUserById(meeting.recipient_id),
    ])

    const meetingAtDate = new Date(meeting.meeting_at)
    const reqTz = countryToTimezone(reqProfile?.country)
    const recTz = countryToTimezone(recProfile?.country)
    const reqLocal = formatInTimezone(meetingAtDate, reqTz)
    const recLocal = formatInTimezone(meetingAtDate, recTz)

    const reqName = reqProfile?.full_name ?? 'Your match'
    const recName = recProfile?.full_name ?? 'Your match'
    const reqEmail = reqAuth?.user?.email
    const recEmail = recAuth?.user?.email

    await Promise.all([
      reqEmail
        ? sendMeetingReminderEmail(reqEmail, firstNameOnly(reqName), recName, reqLocal.dateStr, reqLocal.timeStr, reqLocal.tzLabel, minutesBefore, meeting.room_id, meeting.requester_id)
        : Promise.resolve(),
      recEmail
        ? sendMeetingReminderEmail(recEmail, firstNameOnly(recName), reqName, recLocal.dateStr, recLocal.timeStr, recLocal.tzLabel, minutesBefore, meeting.room_id, meeting.recipient_id)
        : Promise.resolve(),
      reqProfile?.phone
        ? sendMeetingReminderSMS(reqProfile.phone, firstNameOnly(reqName), recName, reqLocal.timeStr, reqLocal.tzLabel, minutesBefore, meeting.room_id)
        : Promise.resolve(),
      recProfile?.phone
        ? sendMeetingReminderSMS(recProfile.phone, firstNameOnly(recName), reqName, recLocal.timeStr, recLocal.tzLabel, minutesBefore, meeting.room_id)
        : Promise.resolve(),
    ])

    await admin
      .from('video_meetings')
      .update(minutesBefore === 60 ? { reminder_60_sent: true } : { reminder_15_sent: true })
      .eq('id', meeting.id)
    sent++
  }

  return Response.json({ sent })
}

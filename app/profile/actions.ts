'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendMeetingRequestEmail, sendMeetingAcceptedEmail, sendMeetingConfirmedAcceptorEmail, sendMeetingDeclinedEmail, sendMeetingCancelledEmail, sendMeetingRescheduledEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'
import {
  sendMeetingRequestSMS,
  sendMeetingAcceptedSMS,
  sendMeetingConfirmedAcceptorSMS,
  sendMeetingDeclinedSMS,
  sendMeetingCancelledSMS,
  sendMeetingRescheduledSMS,
} from '@/lib/sendSMS'
import { zonedTimeToUtc, countryToTimezone } from '@/lib/timezone'
import { isTrialExpired, TRIAL_EXPIRED_MESSAGE, OTHER_TRIAL_EXPIRED_MEETING_MESSAGE } from '@/lib/trial'

export async function requestVideoMeeting(
  recipientId: string,
  preferredDate: string,
  preferredTime: string,
  message: string
): Promise<{ meetingId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const [{ data: myTrial }, { data: recipientTrial }] = await Promise.all([
    supabase.from('profiles').select('plan, created_at').eq('id', user.id).single(),
    supabase.from('profiles').select('plan, created_at').eq('id', recipientId).single(),
  ])
  if (isTrialExpired(myTrial?.plan, myTrial?.created_at)) return { error: TRIAL_EXPIRED_MESSAGE }
  if (isTrialExpired(recipientTrial?.plan, recipientTrial?.created_at)) return { error: OTHER_TRIAL_EXPIRED_MEETING_MESSAGE }

  // Check if a pending/accepted meeting already exists
  const { data: existing } = await supabase
    .from('video_meetings')
    .select('id, status')
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),` +
      `and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (existing) return { meetingId: existing.id }

  // Verify mutual like exists before allowing meeting request
  const [{ data: iLikedThem }, { data: theyLikedMe }] = await Promise.all([
    supabase.from('profile_likes').select('id').eq('liker_id', user.id).eq('liked_id', recipientId).maybeSingle(),
    supabase.from('profile_likes').select('id').eq('liker_id', recipientId).eq('liked_id', user.id).maybeSingle(),
  ])
  if (!iLikedThem || !theyLikedMe) return { error: 'A mutual like is required before requesting a video meeting.' }

  const { data: me } = await supabase.from('profiles').select('full_name, country').eq('id', user.id).single()
  const name = me?.full_name ?? 'Someone'

  const roomId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

  const meetingAt = preferredDate && preferredTime
    ? zonedTimeToUtc(preferredDate, preferredTime, countryToTimezone(me?.country)).toISOString()
    : null

  let meeting: { id: string } | null = null
  const fullInsert = await supabase.from('video_meetings').insert({
    room_id: roomId,
    requester_id: user.id,
    recipient_id: recipientId,
    status: 'pending',
    preferred_date: preferredDate || null,
    preferred_time: preferredTime || null,
    meeting_at: meetingAt,
    message: message || null,
  }).select('id').single()

  if (fullInsert.error) {
    const baseInsert = await supabase.from('video_meetings').insert({
      room_id: roomId,
      requester_id: user.id,
      recipient_id: recipientId,
      status: 'pending',
    }).select('id').single()
    if (baseInsert.error || !baseInsert.data) return { error: baseInsert.error?.message ?? 'Failed to create meeting request' }
    meeting = baseInsert.data
  } else {
    meeting = fullInsert.data
  }

  if (!meeting) return { error: 'Failed to create meeting request' }

  const dateStr = new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    sender_id: user.id,
    type: 'video_meeting_request',
    message: `${name} has requested a video meeting on ${dateStr} at ${preferredTime}. Message: "${message}"`,
  })

  // Fetch recipient profile (email + phone + name)
  const admin = createAdminClient()
  const [{ data: recipientAuth }, { data: recipientProfile }] = await Promise.all([
    admin.auth.admin.getUserById(recipientId),
    supabase.from('profiles').select('full_name, phone').eq('id', recipientId).single(),
  ])

  const recipientEmail = recipientAuth?.user?.email
  const safeDateStr = preferredDate
    ? new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'a date to be confirmed'
  const recipientFirstName = firstNameOnly(recipientProfile?.full_name ?? '')
  const safeTime = preferredTime || 'time to be confirmed'

  await Promise.all([
    recipientEmail
      ? sendMeetingRequestEmail(recipientEmail, recipientFirstName, name, safeDateStr, safeTime, message, recipientId)
      : Promise.resolve(),
    recipientProfile?.phone
      ? sendMeetingRequestSMS(recipientProfile.phone, recipientFirstName, name, safeDateStr, safeTime)
      : Promise.resolve(),
  ])

  return { meetingId: meeting.id }
}

export async function acceptMeeting(meetingId: string): Promise<{ roomId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: myTrial } = await supabase.from('profiles').select('plan, created_at').eq('id', user.id).single()
  if (isTrialExpired(myTrial?.plan, myTrial?.created_at)) return { error: TRIAL_EXPIRED_MESSAGE }

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (!meeting) return { error: 'Meeting not found.' }

  await supabase.from('video_meetings').update({ status: 'accepted' }).eq('id', meetingId)

  const { data: me } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
  const dateStr = new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_accepted',
    message: `${me?.full_name ?? 'Someone'} accepted your video meeting request for ${dateStr} at ${meeting.preferred_time}. Join via the meeting link in your profile.`,
  })

  const admin = createAdminClient()
  const [{ data: requesterAuth }, { data: requesterProfile }, { data: acceptorAuth }] = await Promise.all([
    admin.auth.admin.getUserById(meeting.requester_id),
    supabase.from('profiles').select('full_name, phone').eq('id', meeting.requester_id).single(),
    admin.auth.admin.getUserById(user.id),
  ])

  const requesterEmail = requesterAuth?.user?.email
  const acceptorEmail = acceptorAuth?.user?.email
  const safeDateStr = meeting.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'your requested date'
  const requesterFirstName = firstNameOnly(requesterProfile?.full_name ?? '')
  const acceptorName = me?.full_name ?? 'Your match'
  const acceptorFirstName = firstNameOnly(me?.full_name ?? '')
  const safeTime = meeting.preferred_time ?? ''

  await Promise.all([
    // Email requester
    requesterEmail
      ? sendMeetingAcceptedEmail(requesterEmail, requesterFirstName, acceptorName, safeDateStr, safeTime, meeting.room_id, meeting.requester_id)
      : Promise.resolve(),
    // Email acceptor
    acceptorEmail
      ? sendMeetingConfirmedAcceptorEmail(acceptorEmail, acceptorFirstName, requesterProfile?.full_name ?? 'Your match', safeDateStr, safeTime, meeting.room_id, user.id)
      : Promise.resolve(),
    // SMS requester
    requesterProfile?.phone
      ? sendMeetingAcceptedSMS(requesterProfile.phone, requesterFirstName, acceptorName, safeDateStr, safeTime, meeting.room_id)
      : Promise.resolve(),
    // SMS acceptor
    me?.phone
      ? sendMeetingConfirmedAcceptorSMS(me.phone, acceptorFirstName, requesterProfile?.full_name ?? 'Your match', safeDateStr, safeTime, meeting.room_id)
      : Promise.resolve(),
  ])

  return { roomId: meeting.room_id }
}

export async function declineMeeting(meetingId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, preferred_date, preferred_time')
    .eq('id', meetingId)
    .single()
  if (!meeting) return

  await supabase.from('video_meetings').update({ status: 'declined' }).eq('id', meetingId)

  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = meeting.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'your requested date'

  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_declined',
    message: `${me?.full_name ?? 'Someone'} is unavailable for ${dateStr} at ${meeting.preferred_time}. You can send a new request with a different date.`,
  })

  // SMS the requester
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', meeting.requester_id)
    .single()

  const { data: requesterAuth } = await createAdminClient().auth.admin.getUserById(meeting.requester_id)
  await Promise.all([
    requesterProfile?.phone
      ? sendMeetingDeclinedSMS(requesterProfile.phone, firstNameOnly(requesterProfile.full_name ?? ''), me?.full_name ?? 'Your match', dateStr)
      : Promise.resolve(),
    requesterAuth?.user?.email
      ? sendMeetingDeclinedEmail(requesterAuth.user.email, firstNameOnly(requesterProfile?.full_name ?? ''), me?.full_name ?? 'Your match', dateStr, meeting.requester_id)
      : Promise.resolve(),
  ])
}

export async function cancelMeeting(meetingId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, recipient_id, preferred_date, preferred_time, status')
    .eq('id', meetingId)
    .single()
  if (!meeting) return
  if (!['pending', 'accepted'].includes(meeting.status)) return

  await supabase.from('video_meetings').update({ status: 'cancelled' }).eq('id', meetingId)

  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = meeting.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'the requested date'

  // Notify the recipient (the other person)
  const otherId = user.id === meeting.requester_id ? meeting.recipient_id : meeting.requester_id
  await supabase.from('notifications').insert({
    recipient_id: otherId,
    sender_id: user.id,
    type: 'meeting_cancelled',
    message: `${me?.full_name ?? 'Someone'} has withdrawn their video meeting request for ${dateStr}.`,
  })

  const [{ data: otherProfile }, { data: otherAuth }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', otherId).single(),
    createAdminClient().auth.admin.getUserById(otherId),
  ])

  await Promise.all([
    otherProfile?.phone
      ? sendMeetingCancelledSMS(otherProfile.phone, firstNameOnly(otherProfile.full_name ?? ''), me?.full_name ?? 'Your match', dateStr)
      : Promise.resolve(),
    otherAuth?.user?.email
      ? sendMeetingCancelledEmail(otherAuth.user.email, firstNameOnly(otherProfile?.full_name ?? ''), me?.full_name ?? 'Your match', dateStr, otherId)
      : Promise.resolve(),
  ])
}

export async function rescheduleMeeting(meetingId: string, newDate: string, newTime: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!newDate || !newTime) return { error: 'Please choose a date and time.' }

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, recipient_id, status')
    .eq('id', meetingId)
    .single()
  if (!meeting) return { error: 'Meeting not found.' }
  if (user.id !== meeting.requester_id && user.id !== meeting.recipient_id) return { error: 'Not authorized.' }
  if (!['pending', 'accepted'].includes(meeting.status)) return { error: 'This meeting can no longer be rescheduled.' }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('country')
    .eq('id', meeting.requester_id)
    .single()
  const meetingAt = zonedTimeToUtc(newDate, newTime, countryToTimezone(requesterProfile?.country)).toISOString()

  await supabase.from('video_meetings').update({
    preferred_date: newDate,
    preferred_time: newTime,
    meeting_at: meetingAt,
    reminder_60_sent: false,
    reminder_15_sent: false,
  }).eq('id', meetingId)

  const otherId = user.id === meeting.requester_id ? meeting.recipient_id : meeting.requester_id
  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = new Date(newDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const changerName = me?.full_name ?? 'Your match'

  await supabase.from('notifications').insert({
    recipient_id: otherId,
    sender_id: user.id,
    type: 'meeting_rescheduled',
    message: `${changerName} has changed your video meeting to ${dateStr} at ${newTime}.`,
  })

  const [{ data: otherProfile }, { data: otherAuth }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', otherId).single(),
    createAdminClient().auth.admin.getUserById(otherId),
  ])

  await Promise.all([
    otherProfile?.phone
      ? sendMeetingRescheduledSMS(otherProfile.phone, firstNameOnly(otherProfile.full_name ?? ''), changerName, dateStr, newTime)
      : Promise.resolve(),
    otherAuth?.user?.email
      ? sendMeetingRescheduledEmail(otherAuth.user.email, firstNameOnly(otherProfile?.full_name ?? ''), changerName, dateStr, newTime, otherId)
      : Promise.resolve(),
  ])

  revalidatePath('/profile')
  return { success: true }
}

export async function cancelSubscription(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await supabase.from('profiles').update({ plan: 'free', plan_started_at: null }).eq('id', user.id)
  revalidatePath('/profile')
  revalidatePath('/subscription')
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  // Collect storage paths to delete
  const { data: profile } = await supabase
    .from('profiles')
    .select('back_photo_1_path, back_photo_2_path, front_photo_path, voice_path, voice_native_path, id_document_path')
    .eq('id', user.id)
    .single()

  const p = profile as Record<string, unknown> | null
  const paths = [
    p?.back_photo_1_path, p?.back_photo_2_path, p?.front_photo_path,
    p?.voice_path, p?.voice_native_path, p?.id_document_path,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0)

  if (paths.length > 0) {
    await admin.storage.from('profile-media').remove(paths)
  }

  await Promise.all([
    admin.from('photo_reveals').delete().or(`viewer_id.eq.${user.id},viewed_id.eq.${user.id}`),
    admin.from('notifications').delete().or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`),
    admin.from('shortlist').delete().or(`user_id.eq.${user.id},profile_id.eq.${user.id}`),
    admin.from('video_meetings').delete().or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`),
    admin.from('reports').delete().or(`reporter_id.eq.${user.id},reported_id.eq.${user.id}`),
    admin.from('referrals').delete().or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`),
    admin.from('extra_meeting_purchases').delete().eq('user_id', user.id),
  ])

  await admin.from('profiles').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)
}

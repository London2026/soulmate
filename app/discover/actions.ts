'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotoRevealedEmail, sendMeetingAcceptedEmail, sendMeetingConfirmedAcceptorEmail, sendMeetingDeclinedEmail, sendReportNotificationEmail } from '@/lib/sendEmail'
import { sendPhotoRevealSMS, sendMeetingAcceptedSMS, sendMeetingConfirmedAcceptorSMS, sendMeetingDeclinedSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'


export async function revealPhoto(viewedUserId: string): Promise<{ signedUrl: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Only insert reveal + notification once
  const { data: existing } = await supabase
    .from('photo_reveals')
    .select('id')
    .eq('viewer_id', user.id)
    .eq('viewed_id', viewedUserId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('photo_reveals').insert({
      viewer_id: user.id,
      viewed_id: viewedUserId,
    })

    const [meRes, ownerRes] = await Promise.all([
      supabase.from('profiles').select('full_name, member_id').eq('id', user.id).single(),
      supabase.from('profiles').select('full_name').eq('id', viewedUserId).single(),
    ])
    const viewerName = meRes.data?.full_name ?? 'Someone'
    const ownerName  = ownerRes.data?.full_name ?? ''
    const viewerProfileId = (meRes.data as Record<string, unknown>)?.member_id as string
      ?? '#' + user.id.slice(0, 8).toUpperCase()

    await supabase.from('notifications').insert({
      recipient_id: viewedUserId,
      sender_id: user.id,
      type: 'photo_revealed',
      message: `Your photo was seen today by ${viewerName}. Would you like to check their profile? There is a chance that you may receive a request for an online video meeting.`,
    })

    // Email + SMS the photo owner
    const admin = createAdminClient()
    const [{ data: ownerAuth }, { data: ownerProfile }] = await Promise.all([
      admin.auth.admin.getUserById(viewedUserId),
      supabase.from('profiles').select('phone').eq('id', viewedUserId).single(),
    ])
    const ownerEmail = ownerAuth?.user?.email
    const ownerFirstName = firstNameOnly(ownerName)
    await Promise.all([
      ownerEmail ? sendPhotoRevealedEmail(ownerEmail, ownerFirstName, viewerProfileId, viewedUserId) : Promise.resolve(),
      ownerProfile?.phone ? sendPhotoRevealSMS(ownerProfile.phone, ownerFirstName, viewerProfileId) : Promise.resolve(),
    ])
  }

  // Fetch the front photo path and generate a signed URL
  const { data: profile } = await supabase
    .from('profiles')
    .select('front_photo_path')
    .eq('id', viewedUserId)
    .single()

  if (!profile?.front_photo_path) throw new Error('No front photo on file.')

  const { data: urlData, error } = await supabase.storage
    .from('profile-media')
    .createSignedUrl(profile.front_photo_path, 3600)

  if (error || !urlData?.signedUrl) throw new Error('Could not generate photo URL.')

  return { signedUrl: urlData.signedUrl }
}

export async function toggleShortlist(profileId: string): Promise<{ shortlisted: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('shortlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (existing) {
    await supabase.from('shortlist').delete().eq('user_id', user.id).eq('profile_id', profileId)
    return { shortlisted: false }
  } else {
    await supabase.from('shortlist').insert({ user_id: user.id, profile_id: profileId })
    return { shortlisted: true }
  }
}

export async function reportProfile(reportedId: string, reason: string, message: string): Promise<{ alreadyReported: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('reports').select('id').eq('reporter_id', user.id).eq('reported_id', reportedId).maybeSingle()
  if (existing) return { alreadyReported: true }

  const [meRes, reportedRes] = await Promise.all([
    supabase.from('profiles').select('full_name, member_id').eq('id', user.id).single(),
    supabase.from('profiles').select('member_id').eq('id', reportedId).single(),
  ])

  await supabase.from('reports').insert({ reporter_id: user.id, reported_id: reportedId, reason, message: message || null })

  const reporterName = meRes.data?.full_name ?? 'Unknown'
  const reporterMemberId = (meRes.data as Record<string, unknown>)?.member_id as string ?? '#' + user.id.slice(0, 8).toUpperCase()
  const reportedMemberId = (reportedRes.data as Record<string, unknown>)?.member_id as string ?? '#' + reportedId.slice(0, 8).toUpperCase()

  await sendReportNotificationEmail(reporterName, reporterMemberId, reportedMemberId, reason, message || null)

  return { alreadyReported: false }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
}

export async function acceptMeetingInbox(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('room_id, requester_id, preferred_date, preferred_time')
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
    .single()
  if (!meeting) throw new Error('Meeting not found')
  await supabase
    .from('video_meetings')
    .update({ status: 'accepted' })
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
  const [meRes, requesterRes] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
    supabase.from('profiles').select('full_name, phone').eq('id', meeting.requester_id).single(),
  ])
  const myName = meRes.data?.full_name ?? 'Someone'
  const myFirstName = firstNameOnly(myName)
  const requesterFirstName = firstNameOnly(requesterRes.data?.full_name ?? 'Someone')
  const dateStr = (meeting as Record<string, unknown>).preferred_date as string ?? 'the agreed date'
  const time = (meeting as Record<string, unknown>).preferred_time as string ?? ''

  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_accepted',
    message: `${myName} has accepted your meeting request! Join via your Meetings tab.`,
  })

  const admin = createAdminClient()
  const [{ data: requesterAuth }, { data: acceptorAuth }] = await Promise.all([
    admin.auth.admin.getUserById(meeting.requester_id),
    admin.auth.admin.getUserById(user.id),
  ])

  await Promise.all([
    requesterRes.data?.phone
      ? sendMeetingAcceptedSMS(requesterRes.data.phone, requesterFirstName, myName, dateStr, time, meeting.room_id)
      : Promise.resolve(),
    meRes.data?.phone
      ? sendMeetingConfirmedAcceptorSMS(meRes.data.phone, myFirstName, requesterRes.data?.full_name ?? 'Your match', dateStr, time, meeting.room_id)
      : Promise.resolve(),
    requesterAuth?.user?.email
      ? sendMeetingAcceptedEmail(requesterAuth.user.email, requesterFirstName, myName, dateStr, time, meeting.room_id, meeting.requester_id)
      : Promise.resolve(),
    acceptorAuth?.user?.email
      ? sendMeetingConfirmedAcceptorEmail(acceptorAuth.user.email, myFirstName, requesterRes.data?.full_name ?? 'Your match', dateStr, time, meeting.room_id, user.id)
      : Promise.resolve(),
  ])
}

export async function declineMeetingInbox(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, preferred_date')
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
    .single()
  if (!meeting) throw new Error('Meeting not found')
  await supabase
    .from('video_meetings')
    .update({ status: 'declined' })
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
  const [meRes, requesterRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('profiles').select('full_name, phone').eq('id', meeting.requester_id).single(),
  ])
  const myName = meRes.data?.full_name ?? 'Someone'
  const requesterFirstName = firstNameOnly(requesterRes.data?.full_name ?? 'Someone')
  const dateStr = (meeting as Record<string, unknown>).preferred_date as string ?? 'the agreed date'

  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_declined',
    message: `${myName} has declined your meeting request.`,
  })

  const admin = createAdminClient()
  const { data: requesterAuth } = await admin.auth.admin.getUserById(meeting.requester_id)

  await Promise.all([
    requesterRes.data?.phone
      ? sendMeetingDeclinedSMS(requesterRes.data.phone, requesterFirstName, myName, dateStr)
      : Promise.resolve(),
    requesterAuth?.user?.email
      ? sendMeetingDeclinedEmail(requesterAuth.user.email, requesterFirstName, myName, dateStr, meeting.requester_id)
      : Promise.resolve(),
  ])
}

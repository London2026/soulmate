'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotoRevealedEmail } from '@/lib/sendEmail'
import { sendPhotoRevealSMS } from '@/lib/sendSMS'
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
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('profiles').select('full_name').eq('id', viewedUserId).single(),
    ])
    const viewerName = meRes.data?.full_name ?? 'Someone'
    const ownerName  = ownerRes.data?.full_name ?? ''

    await supabase.from('notifications').insert({
      recipient_id: viewedUserId,
      sender_id: user.id,
      type: 'photo_revealed',
      message: `Your photo was seen today by ${viewerName}. Would you like to check their profile? There is a chance that you may receive a request for an online video meeting.`,
    })

    const viewerProfileId = user.id.slice(0, 8).toUpperCase()

    // Email + SMS the photo owner
    const admin = createAdminClient()
    const [{ data: ownerAuth }, { data: ownerProfile }] = await Promise.all([
      admin.auth.admin.getUserById(viewedUserId),
      supabase.from('profiles').select('phone').eq('id', viewedUserId).single(),
    ])
    const ownerEmail = ownerAuth?.user?.email
    const ownerFirstName = firstNameOnly(ownerName)
    await Promise.all([
      ownerEmail ? sendPhotoRevealedEmail(ownerEmail, ownerFirstName, viewerProfileId) : Promise.resolve(),
      ownerProfile?.phone ? sendPhotoRevealSMS(ownerProfile.phone, ownerFirstName) : Promise.resolve(),
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
    .select('room_id, requester_id')
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
    .single()
  if (!meeting) throw new Error('Meeting not found')
  await supabase
    .from('video_meetings')
    .update({ status: 'accepted' })
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
  const [meRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])
  const myName = meRes.data?.full_name ?? 'Someone'
  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_accepted',
    message: `${myName} has accepted your meeting request! Join via your Meetings tab.`,
  })
}

export async function declineMeetingInbox(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id')
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
    .single()
  if (!meeting) throw new Error('Meeting not found')
  await supabase
    .from('video_meetings')
    .update({ status: 'declined' })
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
  const [meRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])
  const myName = meRes.data?.full_name ?? 'Someone'
  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_declined',
    message: `${myName} has declined your meeting request.`,
  })
}

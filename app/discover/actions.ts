'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotoRevealedEmail, sendMeetingAcceptedEmail, sendMeetingConfirmedAcceptorEmail, sendMeetingDeclinedEmail, sendReportNotificationEmail, sendMutualShortlistEmail, sendLikeNotificationEmail } from '@/lib/sendEmail'
import { sendPhotoRevealSMS, sendMeetingAcceptedSMS, sendMeetingConfirmedAcceptorSMS, sendMeetingDeclinedSMS, sendLikeSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'
import { isTrialExpired, TRIAL_EXPIRED_MESSAGE, OTHER_TRIAL_EXPIRED_LIKE_MESSAGE } from '@/lib/trial'

const LIKE_LIMITS: Record<string, number> = { free: 5, starter: 10, standard: 15 }
const FREE_REVEAL_LIMIT = 5

export async function likeProfile(likedId: string): Promise<{ success: boolean; limitReached: boolean; nowMutual: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: me } = await supabase.from('profiles').select('plan, full_name, member_id, created_at').eq('id', user.id).single()
  const plan = me?.plan ?? 'free'

  if (isTrialExpired(plan, me?.created_at)) {
    return { success: false, limitReached: false, nowMutual: false, error: TRIAL_EXPIRED_MESSAGE }
  }

  const { data: likedProfile } = await supabase
    .from('profiles')
    .select('full_name, phone, member_id, plan, created_at')
    .eq('id', likedId)
    .single()

  if (isTrialExpired(likedProfile?.plan, likedProfile?.created_at)) {
    return { success: false, limitReached: false, nowMutual: false, error: OTHER_TRIAL_EXPIRED_LIKE_MESSAGE }
  }

  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const { count: likesSent } = await supabase
    .from('profile_likes')
    .select('*', { count: 'exact', head: true })
    .eq('liker_id', user.id)
    .gte('created_at', monthStart.toISOString())

  const limit = LIKE_LIMITS[plan] ?? 2
  if ((likesSent ?? 0) >= limit) {
    return { success: false, limitReached: true, nowMutual: false }
  }

  await supabase.from('profile_likes').upsert(
    { liker_id: user.id, liked_id: likedId },
    { onConflict: 'liker_id,liked_id' }
  )

  // Check if the other person already liked me — establishes mutual like
  const { data: mutualCheck } = await supabase
    .from('profile_likes')
    .select('id')
    .eq('liker_id', likedId)
    .eq('liked_id', user.id)
    .maybeSingle()

  const nowMutual = !!mutualCheck

  const likerMemberId = (me as Record<string, unknown>)?.member_id as string ?? '#' + user.id.slice(0, 8).toUpperCase()
  const likedFirstName = firstNameOnly(likedProfile?.full_name ?? '')

  await supabase.from('notifications').insert({
    recipient_id: likedId,
    sender_id: user.id,
    type: 'profile_liked',
    message: `Your profile was liked by member ${likerMemberId}. Visit their profile — if you both like each other, you will be able to request an online video meeting!`,
  })

  if (nowMutual) {
    const otherMemberId = (likedProfile as Record<string, unknown>)?.member_id as string ?? '#' + likedId.slice(0, 8).toUpperCase()
    await Promise.all([
      supabase.from('notifications').insert({
        recipient_id: user.id,
        sender_id: likedId,
        type: 'mutual_like',
        message: `Mutual like! You and member ${otherMemberId} have liked each other. You can now request a video meeting!`,
      }),
      supabase.from('notifications').insert({
        recipient_id: likedId,
        sender_id: user.id,
        type: 'mutual_like',
        message: `Mutual like! You and member ${likerMemberId} have liked each other. You can now request a video meeting!`,
      }),
    ])
  }

  const admin = createAdminClient()
  const { data: likedAuth } = await admin.auth.admin.getUserById(likedId)
  const likedEmail = likedAuth?.user?.email

  await Promise.all([
    likedEmail ? sendLikeNotificationEmail(likedEmail, likedFirstName, likerMemberId, likedId) : Promise.resolve(),
    likedProfile?.phone ? sendLikeSMS(likedProfile.phone, likedFirstName, likerMemberId) : Promise.resolve(),
  ])

  return { success: true, limitReached: false, nowMutual }
}

export async function unlikeProfile(likedId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await supabase.from('profile_likes').delete().eq('liker_id', user.id).eq('liked_id', likedId)
}


export async function revealPhoto(viewedUserId: string): Promise<{ signedUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Enforce monthly reveal limit for free users
  const { data: me } = await supabase.from('profiles').select('plan, created_at').eq('id', user.id).single()
  if (isTrialExpired(me?.plan, me?.created_at)) return { error: TRIAL_EXPIRED_MESSAGE }
  if ((me?.plan ?? 'free') === 'free') {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { count: revealsThisMonth } = await supabase
      .from('photo_reveals').select('*', { count: 'exact', head: true })
      .eq('viewer_id', user.id).gte('created_at', monthStart.toISOString())
    if ((revealsThisMonth ?? 0) >= FREE_REVEAL_LIMIT) {
      return { error: "You've used all 5 photo reveals for this month. Upgrade your plan for unlimited reveals." }
    }
  }

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

  if (!profile?.front_photo_path) return { error: 'No front photo on file.' }

  const { data: urlData, error } = await supabase.storage
    .from('profile-media')
    .createSignedUrl(profile.front_photo_path, 3600)

  if (error || !urlData?.signedUrl) return { error: 'Could not generate photo URL.' }

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

    // Check if the other person has also shortlisted us — mutual match
    const { data: mutual } = await supabase
      .from('shortlist').select('id').eq('user_id', profileId).eq('profile_id', user.id).maybeSingle()

    if (mutual) {
      const [meRes, otherRes] = await Promise.all([
        supabase.from('profiles').select('full_name, member_id').eq('id', user.id).single(),
        supabase.from('profiles').select('full_name, member_id').eq('id', profileId).single(),
      ])
      const myName = meRes.data?.full_name ?? 'Someone'
      const otherName = otherRes.data?.full_name ?? 'Someone'
      const myMemberId = (meRes.data as Record<string, unknown>)?.member_id as string ?? '#' + user.id.slice(0, 8).toUpperCase()
      const otherMemberId = (otherRes.data as Record<string, unknown>)?.member_id as string ?? '#' + profileId.slice(0, 8).toUpperCase()

      await Promise.all([
        supabase.from('notifications').insert({ recipient_id: user.id, sender_id: profileId, type: 'mutual_shortlist', message: `You and ${otherName} have both shortlisted each other — why not send a meeting request?` }),
        supabase.from('notifications').insert({ recipient_id: profileId, sender_id: user.id, type: 'mutual_shortlist', message: `You and ${myName} have both shortlisted each other — why not send a meeting request?` }),
      ])

      const admin = createAdminClient()
      const [{ data: myAuth }, { data: otherAuth }] = await Promise.all([
        admin.auth.admin.getUserById(user.id),
        admin.auth.admin.getUserById(profileId),
      ])
      await Promise.all([
        myAuth?.user?.email ? sendMutualShortlistEmail(myAuth.user.email, myName.split(' ')[0], otherMemberId, user.id) : Promise.resolve(),
        otherAuth?.user?.email ? sendMutualShortlistEmail(otherAuth.user.email, otherName.split(' ')[0], myMemberId, profileId) : Promise.resolve(),
      ])
    }

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

export async function blockProfile(blockedId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await supabase.from('blocks').upsert(
    { blocker_id: user.id, blocked_id: blockedId },
    { onConflict: 'blocker_id,blocked_id' }
  )
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

export async function acceptMeetingInbox(meetingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: myTrial } = await supabase.from('profiles').select('plan, created_at').eq('id', user.id).single()
  if (isTrialExpired(myTrial?.plan, myTrial?.created_at)) return { error: TRIAL_EXPIRED_MESSAGE }

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('room_id, requester_id, preferred_date, preferred_time')
    .eq('id', meetingId)
    .eq('recipient_id', user.id)
    .single()
  if (!meeting) return { error: 'Meeting not found.' }
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

  return {}
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

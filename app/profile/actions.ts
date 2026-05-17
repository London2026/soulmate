'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestVideoMeeting(recipientId: string): Promise<{ roomId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Return existing meeting if one already exists between these two users
  const { data: existing } = await supabase
    .from('video_meetings')
    .select('room_id')
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),` +
      `and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .maybeSingle()

  if (existing) return { roomId: existing.room_id }

  // Generate a short unique room ID
  const roomId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

  await supabase.from('video_meetings').insert({
    room_id: roomId,
    requester_id: user.id,
    recipient_id: recipientId,
    status: 'pending',
  })

  const { data: me } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    sender_id: user.id,
    type: 'video_meeting_request',
    message: `${me?.full_name ?? 'Someone'} has sent you a video meeting request. Open Soul Mate to join.`,
  })

  return { roomId }
}

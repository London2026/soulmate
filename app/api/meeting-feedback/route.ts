import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { meetingId, rating, note } = body as { meetingId: string; rating: number; note: string | null }

  if (!meetingId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Verify user is a participant in this meeting
  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, recipient_id, status')
    .eq('id', meetingId)
    .single()

  if (!meeting || (meeting.requester_id !== user.id && meeting.recipient_id !== user.id)) {
    return Response.json({ error: 'Not a participant' }, { status: 403 })
  }
  if (meeting.status !== 'accepted') {
    return Response.json({ error: 'Meeting not accepted' }, { status: 400 })
  }

  const { error } = await supabase.from('meeting_feedback').upsert({
    meeting_id: meetingId,
    reviewer_id: user.id,
    rating,
    note: note || null,
  }, { onConflict: 'meeting_id,reviewer_id' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

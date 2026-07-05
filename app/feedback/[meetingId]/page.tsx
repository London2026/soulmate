import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FeedbackClient from './FeedbackClient'

export default async function FeedbackPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/feedback/${meetingId}`)

  const admin = createAdminClient()

  // Verify meeting exists and user is a participant
  const { data: meeting } = await admin
    .from('video_meetings')
    .select('id, requester_id, recipient_id, preferred_date, preferred_time, status')
    .eq('id', meetingId)
    .single()

  if (!meeting) redirect('/discover')
  if (meeting.requester_id !== user.id && meeting.recipient_id !== user.id) redirect('/discover')
  if (meeting.status !== 'accepted') redirect('/discover')

  // Check if already submitted
  const { data: existing } = await supabase
    .from('meeting_feedback')
    .select('id, rating, note')
    .eq('meeting_id', meetingId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  // Get the other participant's name (masked)
  const otherId = meeting.requester_id === user.id ? meeting.recipient_id : meeting.requester_id
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', otherId)
    .single()

  const otherFirstName = (otherProfile?.full_name ?? 'your match').split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />
      <FeedbackClient
        meetingId={meetingId}
        otherFirstName={otherFirstName}
        preferredDate={meeting.preferred_date ?? null}
        alreadySubmitted={!!existing}
        existingRating={existing?.rating ?? null}
        existingNote={existing?.note ?? null}
      />
    </div>
  )
}

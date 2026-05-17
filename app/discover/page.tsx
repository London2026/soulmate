import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import ProfileCard, { type ProfileData } from './ProfileCard'
import NotificationBanner from './NotificationBanner'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Guard: onboarding must be complete + get plan
  const { data: me } = await supabase
    .from('profiles')
    .select('onboarding_complete, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!me?.onboarding_complete) redirect('/onboarding')

  const userPlan = me?.plan ?? 'free'
  const canReveal = userPlan !== 'free'
  const canMeet   = userPlan !== 'free'

  // Fetch all complete profiles except the current user
  const { data: rows } = await supabase
    .from('profiles')
    .select(`
      id, full_name, age, gender, city, country,
      religion, mother_tongue, education, occupation,
      back_photo_1_path, back_photo_2_path, voice_path, front_photo_path
    `)
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // Which profiles has the current user already revealed?
  const { data: myReveals } = await supabase
    .from('photo_reveals')
    .select('viewed_id')
    .eq('viewer_id', user.id)

  const revealedSet = new Set((myReveals ?? []).map((r) => r.viewed_id as string))

  // Existing video meetings
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('room_id, requester_id, recipient_id')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const meetingByOther: Record<string, string> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = m.room_id
  }

  // Collect all storage paths we need signed URLs for
  const allPaths: string[] = []
  for (const p of rows ?? []) {
    if (p.back_photo_1_path) allPaths.push(p.back_photo_1_path)
    if (p.back_photo_2_path) allPaths.push(p.back_photo_2_path)
    if (p.voice_path) allPaths.push(p.voice_path)
    // front photo only for already-revealed profiles
    if (revealedSet.has(p.id) && p.front_photo_path) allPaths.push(p.front_photo_path)
  }

  // Batch sign all URLs in one call
  const urlMap: Record<string, string> = {}
  if (allPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(allPaths, 3600)

    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urlMap[item.path] = item.signedUrl
    }
  }

  const profiles: ProfileData[] = (rows ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    age: p.age,
    gender: p.gender,
    city: p.city,
    country: p.country,
    religion: p.religion,
    mother_tongue: p.mother_tongue,
    education: p.education,
    occupation: p.occupation,
    back_photo_1_url: p.back_photo_1_path ? (urlMap[p.back_photo_1_path] ?? null) : null,
    back_photo_2_url: p.back_photo_2_path ? (urlMap[p.back_photo_2_path] ?? null) : null,
    voice_url: p.voice_path ? (urlMap[p.voice_path] ?? null) : null,
    front_photo_url:
      revealedSet.has(p.id) && p.front_photo_path
        ? (urlMap[p.front_photo_path] ?? null)
        : null,
    already_revealed: revealedSet.has(p.id),
    meeting_room_id: meetingByOther[p.id] ?? null,
  }))

  // Fetch unread notifications for the current user
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, message, read, created_at')
    .eq('recipient_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--oxford-navy)' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}
      />

      <Navigation />

      <main className="mx-auto pt-24 pb-28 px-4 max-w-xl">

        {/* Page heading */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between">
            <h1
              className="text-3xl"
              style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}
            >
              Discover
            </h1>
            <span className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
              {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
            </span>
          </div>
          <div
            className="mt-2 h-px"
            style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }}
          />
        </div>

        {/* Unread notifications */}
        <NotificationBanner notifications={notifications ?? []} />

        {/* Profile feed */}
        {profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} canReveal={canReveal} canMeet={canMeet} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div
        className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center text-3xl"
        style={{ backgroundColor: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        💘
      </div>
      <h2
        className="text-2xl mb-2"
        style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}
      >
        No profiles yet
      </h2>
      <p className="text-sm" style={{ color: 'var(--ivory-dim)' }}>
        Be the first to invite someone to Soul Mate.
      </p>
    </div>
  )
}

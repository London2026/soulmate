import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import RevealedByCard, { type Viewer } from './RevealedByCard'
import MeetingCard from './MeetingCard'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  // ── Own media signed URLs ────────────────────────────────────
  const ownPaths = [
    profile.back_photo_1_path,
    profile.back_photo_2_path,
    profile.voice_path,
  ].filter((p): p is string => !!p)

  const ownUrlMap: Record<string, string> = {}
  if (ownPaths.length) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(ownPaths, 3600)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) ownUrlMap[s.path] = s.signedUrl
    }
  }

  // ── Who revealed YOUR photo ──────────────────────────────────
  const { data: revealRows } = await supabase
    .from('photo_reveals')
    .select('viewer_id, revealed_at')
    .eq('viewed_id', user.id)
    .order('revealed_at', { ascending: false })

  const viewerIds = (revealRows ?? []).map((r) => r.viewer_id as string)

  const viewerProfiles =
    viewerIds.length > 0
      ? (
          await supabase
            .from('profiles')
            .select('id, full_name, age, city, religion, back_photo_1_path')
            .in('id', viewerIds)
        ).data ?? []
      : []

  // Sign viewer thumbnails in one batch
  const thumbPaths = viewerProfiles
    .map((v) => v.back_photo_1_path)
    .filter((p): p is string => !!p)

  const thumbUrlMap: Record<string, string> = {}
  if (thumbPaths.length) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(thumbPaths, 3600)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) thumbUrlMap[s.path] = s.signedUrl
    }
  }

  // ── Video meetings ───────────────────────────────────────────
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('id, room_id, requester_id, recipient_id, status, created_at, preferred_date, preferred_time, message')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Build a map: other_user_id → room_id (for revealed-by cards)
  const meetingByOther: Record<string, string> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = m.room_id
  }

  // Collect names for meeting cards
  const meetingOtherIds = (meetingRows ?? []).map((m) =>
    m.requester_id === user.id ? m.recipient_id : m.requester_id
  )
  const { data: meetingProfiles } =
    meetingOtherIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', meetingOtherIds)
      : { data: [] }

  const nameById = Object.fromEntries(
    (meetingProfiles ?? []).map((p) => [p.id, p.full_name])
  )

  // ── Assemble viewer data ─────────────────────────────────────
  const viewers: Viewer[] = viewerProfiles.map((v) => ({
    id: v.id,
    full_name: v.full_name,
    age: v.age,
    city: v.city,
    religion: v.religion,
    thumbnail_url: v.back_photo_1_path ? (thumbUrlMap[v.back_photo_1_path] ?? null) : null,
    meeting_room_id: meetingByOther[v.id] ?? null,
    revealed_at:
      revealRows?.find((r) => r.viewer_id === v.id)?.revealed_at ?? '',
  }))

  const meetings = (meetingRows ?? []).map((m) => ({
    id: m.id,
    room_id: m.room_id,
    status: m.status,
    created_at: m.created_at,
    i_requested: m.requester_id === user.id,
    other_name: nameById[m.requester_id === user.id ? m.recipient_id : m.requester_id] ?? 'Member',
    preferred_date: m.preferred_date ?? null,
    preferred_time: m.preferred_time ?? null,
    message: m.message ?? null,
  }))

  const back1Url = profile.back_photo_1_path ? ownUrlMap[profile.back_photo_1_path] ?? null : null
  const back2Url = profile.back_photo_2_path ? ownUrlMap[profile.back_photo_2_path] ?? null : null
  const voiceUrl = profile.voice_path ? ownUrlMap[profile.voice_path] ?? null : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--oxford-navy)' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }}
      />

      <Navigation />

      <main className="mx-auto pt-24 pb-28 px-4 max-w-xl">

        {/* ── Header ── */}
        <div className="flex items-baseline justify-between mb-2">
          <h1
            className="text-3xl"
            style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}
          >
            My Profile
          </h1>
          <Link
            href="/onboarding"
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--antique-gold)' }}
          >
            Edit Profile →
          </Link>
        </div>
        <div className="mb-6 h-px" style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }} />

        {/* ── Profile card ── */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ backgroundColor: 'var(--oxford-navy-mid)', border: '1px solid rgba(201,168,76,0.18)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
        >
          {/* Info */}
          <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
            <h2
              className="text-xl mb-0.5"
              style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}
            >
              {profile.full_name}
            </h2>
            <p className="text-sm" style={{ color: 'var(--ivory-dim)' }}>
              {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {[profile.religion, profile.mother_tongue, profile.education, profile.occupation]
                .filter(Boolean)
                .map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded"
                    style={{ backgroundColor: 'rgba(14,26,53,0.7)', color: 'var(--ivory-dim)', border: '1px solid rgba(201,168,76,0.1)' }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>

          {/* Back photos */}
          {(back1Url || back2Url) && (
            <div className={`grid gap-0.5 ${back1Url && back2Url ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {[back1Url, back2Url].filter(Boolean).map((url, i) => (
                <div key={i} className="relative bg-slate-900" style={{ aspectRatio: '4/3' }}>
                  <img src={url!} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Voice */}
          {voiceUrl && (
            <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(201,168,76,0.07)' }}>
              <p className="text-xs mb-2 tracking-widest uppercase" style={{ color: 'var(--antique-gold)' }}>
                🎙 Voice Introduction
              </p>
              <audio
                controls
                src={voiceUrl}
                preload="none"
                className="w-full"
                style={{ accentColor: 'var(--antique-gold)', height: '36px' }}
              />
            </div>
          )}
        </div>

        {/* ── Who revealed your photo ── */}
        <Section
          title="Who Revealed Your Photo"
          count={viewers.length}
          empty="No one has revealed your photo yet."
        >
          {viewers.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {viewers.map((v) => (
                <RevealedByCard key={v.id} viewer={v} />
              ))}
            </div>
          )}
        </Section>

        {/* ── Video meetings ── */}
        <Section
          title="Video Meetings"
          count={meetings.length}
          empty="No video meeting requests yet."
        >
          {meetings.length > 0 && (
            <div className="space-y-3">
              {meetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </Section>

      </main>

      <BottomNav />
    </div>
  )
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--antique-gold)' }}>
          ✦ {title}
        </p>
        {count > 0 && (
          <span
            className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold"
            style={{ backgroundColor: 'var(--antique-gold)', color: 'var(--oxford-navy)' }}
          >
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ivory-dim)' }}>{empty}</p>
      ) : (
        children
      )}
    </div>
  )
}

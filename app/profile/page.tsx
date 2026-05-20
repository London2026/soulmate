import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import RevealedByCard, { type Viewer } from './RevealedByCard'
import MeetingCard from './MeetingCard'

const c = {
  bg: '#07111f',
  navy: '#0d1f3c',
  navyMid: '#1a3a5c',
  gold: '#8b6914',
  goldLight: '#c9a84c',
  sepia: '#5a6e82',
  ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6',
  border: 'rgba(201,168,76,0.18)',
  borderSub: 'rgba(201,168,76,0.08)',
}

function isProfileUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

function shortProfileLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 22 ? u.pathname.slice(0, 22) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch {
    return url.length > 34 ? url.slice(0, 34) + '…' : url
  }
}

function splitChips(value: string): string[] {
  if (!value) return []
  // Support both " | " (new format) and "," (legacy format)
  if (value.includes(' | ')) return value.split(' | ').map(s => s.trim()).filter(Boolean)
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

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

  // Own media signed URLs
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

  // Who revealed YOUR photo
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

  // Video meetings
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('id, room_id, requester_id, recipient_id, status, created_at, preferred_date, preferred_time, message')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const meetingByOther: Record<string, string> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = m.room_id
  }

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

  const viewers: Viewer[] = viewerProfiles.map((v) => ({
    id: v.id,
    full_name: v.full_name,
    age: v.age,
    city: v.city,
    religion: v.religion,
    thumbnail_url: v.back_photo_1_path ? (thumbUrlMap[v.back_photo_1_path] ?? null) : null,
    meeting_room_id: meetingByOther[v.id] ?? null,
    revealed_at: revealRows?.find((r) => r.viewer_id === v.id)?.revealed_at ?? '',
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

  const personalityFields = [
    { label: 'Favourite Reels', value: profile.fav_reels },
    { label: 'YouTube Channels', value: profile.fav_youtube },
    { label: 'Web Series', value: profile.fav_web_series },
    { label: 'Travel', value: profile.fav_travel },
    { label: 'Foods', value: profile.fav_foods },
    { label: 'AI Tools', value: profile.fav_ai_tools },
  ].filter((f) => f.value)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.bg }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />

      <Navigation />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '6rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>
              My Profile
            </h1>
            {/* Profile ID — big and prominent */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '8px' }}>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sepia }}>Profile ID</span>
              <span style={{ fontFamily: '"Courier New", monospace', fontSize: '1.25rem', fontWeight: 900, color: c.goldLight, letterSpacing: '0.12em' }}>
                #{user.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <Link href="/onboarding?edit=true"
            style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', marginTop: '0.5rem' }}>
            Edit Profile →
          </Link>
        </div>
        <div style={{ height: '1px', background: `linear-gradient(to right, ${c.goldLight}, transparent)`, marginBottom: '2rem' }} />

        {/* Profile card */}
        <div style={{ background: 'rgba(26,58,92,0.25)', border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>

          {/* Info section */}
          <div style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: `1px solid ${c.borderSub}` }}>
            <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.25rem' }}>
              {profile.full_name}
            </h2>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim, margin: '0 0 0.75rem' }}>
              {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[profile.religion, profile.mother_tongue, profile.education, profile.occupation]
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', padding: '0.25rem 0.65rem', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.18)`, borderRadius: '20px', color: c.goldLight }}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>

          {/* Back photos */}
          {(back1Url || back2Url) && (
            <div style={{ display: 'grid', gridTemplateColumns: back1Url && back2Url ? '1fr 1fr' : '1fr', gap: '2px' }}>
              {[back1Url, back2Url].filter(Boolean).map((url, i) => (
                <div key={i} style={{ aspectRatio: '4/3', backgroundColor: c.navy, overflow: 'hidden' }}>
                  <img src={url!} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}

          {/* Voice intro */}
          {voiceUrl && (
            <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${c.borderSub}` }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.6rem' }}>
                🎙 Voice Introduction
              </p>
              <audio controls src={voiceUrl} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
            </div>
          )}
        </div>

        {/* Personality section */}
        {personalityFields.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <SectionHeader title="My Personality" count={0} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {personalityFields.map((f) => (
                <div key={f.label} style={{ background: 'rgba(26,58,92,0.2)', border: `1px solid ${c.borderSub}`, borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.4rem' }}>
                    {f.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {splitChips(f.value!).map((chip) => (
                      <div key={chip} style={{ display: 'flex', alignItems: 'center', padding: '0.2rem 0.55rem', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '20px', minWidth: 0, overflow: 'hidden' }}>
                        {isProfileUrl(chip) ? (
                          <a href={chip} target="_blank" rel="noopener noreferrer" title={chip}
                            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.goldLight, textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {shortProfileLabel(chip)}
                          </a>
                        ) : (
                          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.ivory, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chip}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who revealed your photo */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Who Revealed Your Photo" count={viewers.length} />
          {viewers.length === 0 ? (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.sepia }}>
              No one has revealed your photo yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {viewers.map((v) => (
                <RevealedByCard key={v.id} viewer={v} />
              ))}
            </div>
          )}
        </div>

        {/* Video meetings */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Video Meetings" count={meetings.length} />
          {meetings.length === 0 ? (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.sepia }}>
              No video meeting requests yet.
            </p>
          ) : (
            <div>
              {meetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9a84c', margin: 0 }}>
        ✦ {title}
      </p>
      {count > 0 && (
        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#c9a84c', color: '#0d1f3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  )
}

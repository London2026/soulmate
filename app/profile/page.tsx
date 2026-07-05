import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import RevealedByCard, { type Viewer } from './RevealedByCard'
import MeetingCard from './MeetingCard'
import AccountSettings from './AccountSettings'

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
  return /^https?:\/\//i.test(s.trim()) || /^(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|vimeo\.com)/i.test(s.trim())
}

function toFullUrl(s: string): string {
  if (/^https?:\/\//i.test(s.trim())) return s.trim()
  return 'https://' + s.trim()
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
  const nativeVoicePath = (profile as Record<string, unknown>).voice_native_path as string | null ?? null

  const ownPaths = [
    profile.back_photo_1_path,
    profile.back_photo_2_path,
    (profile as Record<string, unknown>).front_photo_path as string | undefined,
    profile.voice_path,
    nativeVoicePath,
    (profile as Record<string, unknown>).id_document_path as string | undefined,
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
  const frontPhotoPath = (profile as Record<string, unknown>).front_photo_path as string | null ?? null
  const frontUrl = frontPhotoPath ? ownUrlMap[frontPhotoPath] ?? null : null
  const voiceUrl = profile.voice_path ? ownUrlMap[profile.voice_path] ?? null : null
  const nativeVoiceUrl = nativeVoicePath ? ownUrlMap[nativeVoicePath] ?? null : null
  const idDocumentPath = (profile as Record<string, unknown>).id_document_path as string | null ?? null
  const idDocumentUrl = idDocumentPath ? ownUrlMap[idDocumentPath] ?? null : null

  const personalityFields = [
    { label: 'My Favourite Reels', value: profile.fav_reels },
    { label: 'My Favourite YouTube Channels', value: profile.fav_youtube },
    { label: 'My Favourite Web Series', value: profile.fav_web_series },
    { label: 'My Favourite Travel Destinations', value: profile.fav_travel },
    { label: 'My Favourite Foods', value: profile.fav_foods },
    { label: 'My Favourite AI Tools', value: profile.fav_ai_tools },
    { label: 'My Hobbies & Interests', value: profile.hobby },
  ].filter((f) => f.value)

  const p = profile as Record<string, unknown>
  const prefFields = [
    { label: 'Looking For', value: p.pref_gender as string },
    { label: 'Age Range', value: p.pref_age_min && p.pref_age_max ? `${p.pref_age_min} – ${p.pref_age_max} yrs` : null },
    { label: 'Location', value: p.pref_location as string },
    { label: 'Religion', value: p.pref_religion as string },
    { label: 'Sub-Religion', value: p.pref_sub_religion as string },
    { label: 'Occupation', value: p.pref_occupation as string },
    { label: 'Height Preference', value: p.pref_height as string },
    { label: 'Ethnicity Preference', value: p.pref_ethnicity as string },
  ].filter((f) => f.value)

  const otherPreferences = p.other_preferences as string | null ?? null

  const idCountry = (profile as Record<string, unknown>).id_country as string | null ?? null

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0a1a 0%, #07111f 45%, #0f0a18 100%)' }}>
      <style>{`
        @keyframes roseFall {
          0%   { transform: translateY(-80px) translateX(0px) rotate(0deg) scale(1); opacity: 0; }
          5%   { opacity: 1; }
          50%  { transform: translateY(50vh) translateX(calc(var(--sway) * 0.5)) rotate(calc(var(--spin) * 0.5)) scale(0.95); opacity: 0.85; }
          85%  { opacity: 0.6; }
          100% { transform: translateY(110vh) translateX(var(--sway)) rotate(var(--spin)) scale(0.85); opacity: 0; }
        }
        .rose { position:fixed; top:-80px; pointer-events:none; z-index:1; animation:roseFall var(--dur) var(--delay) infinite ease-in; will-change:transform; line-height:1; user-select:none; }
        .prof-main { max-width: 860px; margin: 0 auto; padding: 5.5rem 1.5rem 5rem; }
        .prof-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
        .prof-h1 { font-size: 2rem; }
        .prof-id-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1rem; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.35); border-radius: 8px; }
        .prof-id-code { font-size: 1.25rem; }
        .prof-personality-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .prof-revealed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .prof-card-info { padding: 1.5rem 1.5rem 1.25rem; }
        .prof-detail-row { display: grid; grid-template-columns: 44% 1fr; padding: 0.85rem 0; border-bottom: 1px solid rgba(201,168,76,0.08); }
        .prof-section { padding: 1.75rem 1.5rem 1.25rem; }
        @media (max-width: 600px) {
          .prof-main { padding: 5rem 0.75rem 7rem; }
          .prof-h1 { font-size: 1.5rem !important; }
          .prof-header { flex-direction: column; gap: 0.75rem; }
          .prof-id-badge { padding: 0.4rem 0.75rem; }
          .prof-id-code { font-size: 1rem !important; }
          .prof-personality-grid { grid-template-columns: 1fr; }
          .prof-revealed-grid { grid-template-columns: 1fr 1fr; gap: 0.6rem; }
          .prof-card-info { padding: 1rem 1rem 0.9rem; }
          .prof-detail-row { grid-template-columns: 1fr !important; gap: 0.15rem !important; padding: 0.65rem 0 !important; }
          .prof-section { padding: 1.25rem 1rem 0.9rem !important; }
        }
        @media (max-width: 400px) {
          .prof-revealed-grid { grid-template-columns: 1fr; }
          .prof-main { padding: 4.5rem 0.5rem 7rem; }
        }
      `}</style>

      {/* Falling roses */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {([
          { l:'3%',  size:'1.6rem', dur:'9s',  delay:'0s',   sway:'40px',  spin:'360deg'  },
          { l:'8%',  size:'1.2rem', dur:'12s', delay:'1.5s', sway:'-35px', spin:'-270deg' },
          { l:'15%', size:'2rem',   dur:'8s',  delay:'3s',   sway:'50px',  spin:'450deg'  },
          { l:'22%', size:'1.4rem', dur:'14s', delay:'0.5s', sway:'-45px', spin:'320deg'  },
          { l:'30%', size:'1.7rem', dur:'10s', delay:'5s',   sway:'30px',  spin:'-400deg' },
          { l:'38%', size:'1.1rem', dur:'11s', delay:'2s',   sway:'-50px', spin:'280deg'  },
          { l:'45%', size:'2.2rem', dur:'9s',  delay:'7s',   sway:'55px',  spin:'-360deg' },
          { l:'52%', size:'1.4rem', dur:'13s', delay:'1s',   sway:'-30px', spin:'500deg'  },
          { l:'60%', size:'1.8rem', dur:'8s',  delay:'4s',   sway:'45px',  spin:'-420deg' },
          { l:'67%', size:'1.2rem', dur:'15s', delay:'0s',   sway:'-55px', spin:'300deg'  },
          { l:'74%', size:'1.9rem', dur:'10s', delay:'6s',   sway:'35px',  spin:'-480deg' },
          { l:'81%', size:'1.5rem', dur:'11s', delay:'2.5s', sway:'-40px', spin:'360deg'  },
          { l:'88%', size:'1.3rem', dur:'9s',  delay:'8s',   sway:'50px',  spin:'-300deg' },
          { l:'94%', size:'2rem',   dur:'13s', delay:'3.5s', sway:'-35px', spin:'420deg'  },
          { l:'12%', size:'1.4rem', dur:'11s', delay:'9s',   sway:'40px',  spin:'-340deg' },
          { l:'35%', size:'1.1rem', dur:'14s', delay:'4.5s', sway:'-50px', spin:'260deg'  },
          { l:'57%', size:'1.8rem', dur:'8s',  delay:'6.5s', sway:'30px',  spin:'-450deg' },
          { l:'78%', size:'1.5rem', dur:'12s', delay:'1.8s', sway:'-45px', spin:'390deg'  },
          { l:'92%', size:'1.2rem', dur:'10s', delay:'7.5s', sway:'55px',  spin:'-310deg' },
          { l:'48%', size:'1.7rem', dur:'9s',  delay:'10s',  sway:'-30px', spin:'440deg'  },
        ] as const).map((p, i) => (
          <span key={i} className="rose" style={{
            left: p.l, fontSize: p.size,
            ['--dur' as string]: p.dur, ['--delay' as string]: p.delay,
            ['--sway' as string]: p.sway, ['--spin' as string]: p.spin,
          }}>🌹</span>
        ))}
      </div>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(180,40,80,0.06) 0%, transparent 60%)' }} />

      <Navigation />

      <main className="prof-main">

        {/* Header */}
        <div className="prof-header">
          <div>
            <h1 className="prof-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>
              My Profile
            </h1>
            {/* Profile ID */}
            <div className="prof-id-badge">
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sepia }}>Profile ID</span>
              <span className="prof-id-code" style={{ fontFamily: '"Courier New", monospace', fontWeight: 900, color: c.goldLight, letterSpacing: '0.12em' }}>
                {(profile as Record<string, unknown>).member_id as string ?? '#' + user.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <Link href="/onboarding?edit=true"
            style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', padding: '0.5rem 1rem', border: `1px solid rgba(201,168,76,0.35)`, borderRadius: '6px', whiteSpace: 'nowrap' }}>
            ✏ Edit Profile
          </Link>
        </div>
        <div style={{ height: '1px', background: `linear-gradient(to right, ${c.goldLight}, transparent)`, marginBottom: '1.5rem' }} />

        {/* Profile card */}
        <div style={{ background: 'rgba(30,65,115,0.55)', border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>

          {/* Info section */}
          <div className="prof-card-info" style={{ borderBottom: `1px solid ${c.borderSub}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.8rem', fontWeight: 600, color: c.ivory, margin: 0 }}>
                {profile.full_name}
              </h2>
              {profile.id_verified ? (
                <span title="ID Verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '20px', padding: '0.25rem 0.65rem' }}>
                  ✅ ID Verified
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '0.25rem 0.65rem' }}>
                  🪪 ID Verification Pending
                </span>
              )}
            </div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.2rem', color: c.ivoryDim, margin: 0 }}>
              {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
            </p>
          </div>

          {/* Photos — back (non-face) + front (face/reveal) */}
          {(back1Url || back2Url || frontUrl) && (
            <div>
              {(back1Url || back2Url) && (
                <div style={{ display: 'grid', gridTemplateColumns: back1Url && back2Url ? '1fr 1fr' : '1fr', gap: '2px' }}>
                  {[back1Url, back2Url].filter(Boolean).map((url, i) => (
                    <div key={i} style={{ aspectRatio: '4/3', backgroundColor: c.navy, overflow: 'hidden' }}>
                      <img src={url!} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              )}
              {frontUrl && (
                <div style={{ borderTop: `1px solid ${c.borderSub}`, padding: '1rem 1.5rem' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.75rem' }}>
                    🤳 Reveal Photo (face)
                  </p>
                  <div style={{ maxWidth: '320px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${c.border}` }}>
                    <img src={frontUrl} alt="Face photo" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  </div>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.82rem', color: c.sepia, margin: '0.5rem 0 0' }}>
                    Only shared with members you approve.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Voice introductions */}
          {(voiceUrl || nativeVoiceUrl) && (
            <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${c.borderSub}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ProfileSectionHeader icon="🎙" title="Voice Introduction" />
              {nativeVoiceUrl && (
                <div>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.5rem', opacity: 0.85 }}>🇮🇳 Mother Tongue</p>
                  <audio controls src={nativeVoiceUrl} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
                </div>
              )}
              {voiceUrl && (
                <div>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.5rem', opacity: 0.85 }}>🇬🇧 English</p>
                  <audio controls src={voiceUrl} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
                </div>
              )}
            </div>
          )}

          {/* Personal Details */}
          <div className="prof-section" style={{ borderTop: `1px solid ${c.borderSub}`, background: 'transparent' }}>
            <ProfileSectionHeader icon="🧑" title="Personal Details" />
            <div>
              <ProfileDetailRow label="Mother Tongue"  value={profile.mother_tongue} />
              <ProfileDetailRow label="Height"         value={p.height as string} />
              <ProfileDetailRow label="Weight"         value={p.weight as string} />
              <ProfileDetailRow label="Marital Status" value={profile.marital_status} />
              <ProfileDetailRow label="Children"       value={profile.has_kids} />
              <ProfileDetailRow label="Ethnicity"      value={p.ethnicity as string} />
              <ProfileDetailRow label="Zodiac Sign"    value={p.zodiac_sign as string} />
            </div>
          </div>

          {/* Lifestyle & Habits */}
          {[p.habit_smoking, p.habit_drinking, p.habit_drugs, p.habit_betting].some(Boolean) && (
            <div className="prof-section" style={{ borderTop: `1px solid ${c.borderSub}` }}>
              <ProfileSectionHeader icon="🌿" title="Lifestyle &amp; Habits" />
              <div>
                <ProfileDetailRow label="🚬 Smoking"            value={p.habit_smoking as string} />
                <ProfileDetailRow label="🍷 Drinking"           value={p.habit_drinking as string} />
                <ProfileDetailRow label="💊 Recreational Drugs" value={p.habit_drugs as string} />
                <ProfileDetailRow label="🎰 Gambling"           value={p.habit_betting as string} />
              </div>
            </div>
          )}

          {/* Education & Career */}
          <div className="prof-section" style={{ borderTop: `1px solid ${c.borderSub}` }}>
            <ProfileSectionHeader icon="🎓" title="Education & Career" />
            <div>
              <ProfileDetailRow label="Education Level"          value={profile.education} />
              <ProfileDetailRow label="Subject / Specialisation" value={p.education_subject as string} />
              <ProfileDetailRow label="University"               value={p.university as string} />
              <ProfileDetailRow label="Other Qualifications"     value={p.other_qualifications as string} />
              <ProfileDetailRow label="Employment Status"        value={p.employment_status as string} />
              <ProfileDetailRow label="Occupation"               value={profile.occupation} />
              <ProfileDetailRow label="Housing"                  value={p.housing as string} />
            </div>
          </div>

          {/* Looking For */}
          {prefFields.length > 0 && (
            <div className="prof-section" style={{ borderTop: `1px solid ${c.borderSub}`, background: 'transparent' }}>
              <ProfileSectionHeader icon="💑" title="Looking For" />
              <div>
                <ProfileDetailRow label="Gender"               value={p.pref_gender as string} />
                <ProfileDetailRow label="Age Range"            value={p.pref_age_min && p.pref_age_max ? `${p.pref_age_min} – ${p.pref_age_max} years` : null} />
                <ProfileDetailRow label="Religion"             value={p.pref_religion as string} />
                <ProfileDetailRow label="Caste / Sub-Religion" value={p.pref_sub_religion as string} />
                <ProfileDetailRow label="Location"             value={p.pref_location as string} />
                <ProfileDetailRow label="Occupation"           value={p.pref_occupation as string} />
                <ProfileDetailRow label="Preferred Height"     value={p.pref_height as string} />
                <ProfileDetailRow label="Ethnicity"            value={p.pref_ethnicity as string} />
              </div>
              {otherPreferences && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(201,168,76,0.05)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.4rem' }}>Other Preferences</p>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{otherPreferences}</p>
                </div>
              )}
            </div>
          )}

          {/* Personality & Interests */}
          {personalityFields.length > 0 && (
            <div className="prof-section" style={{ borderTop: `1px solid ${c.borderSub}` }}>
              <ProfileSectionHeader icon="✨" title="Personality & Interests" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                {personalityFields.map((f) => (
                  <div key={f.label}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.4rem', opacity: 0.85 }}>{f.label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {splitChips(f.value!).map((chip) => (
                        <div key={chip} style={{ padding: '0.25rem 0.7rem', background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '20px' }}>
                          {isProfileUrl(chip) ? (
                            <a href={toFullUrl(chip)} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.goldLight, textDecoration: 'underline' }}>
                              {shortProfileLabel(toFullUrl(chip))}
                            </a>
                          ) : (
                            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.ivory }}>{chip}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ID Document */}
        {(idCountry || idDocumentUrl) && (
          <div style={{ marginBottom: '2rem' }}>
            <SectionHeader title="ID Document" count={0} />
            <div style={{ background: 'rgba(26,58,92,0.2)', border: `1px solid ${c.borderSub}`, borderRadius: '8px', padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {idDocumentUrl && (
                <img src={idDocumentUrl} alt="ID document" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${c.border}` }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {idCountry && (
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, margin: 0 }}>
                    <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.sepia }}>Country of ID: </span>{idCountry}
                  </p>
                )}
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.sepia, margin: 0 }}>
                  {profile.id_verified ? 'Verified ✅' : 'Pending review by the Banduraa team'}
                </p>
              </div>
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
            <div className="prof-revealed-grid">
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

        {/* Account settings */}
        <AccountSettings
          plan={(profile as Record<string, unknown>).plan as string ?? 'free'}
          memberId={(profile as Record<string, unknown>).member_id as string | null ?? null}
        />

      </main>

      <BottomNav />
    </div>
  )
}

function ProfileDetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="prof-detail-row">
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', fontWeight: 700, color: '#f5f0e6', lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', fontWeight: 500, color: '#f5f0e6', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

function ProfileSectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f5f0e6' }}>{title}</span>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9a84c', margin: 0 }}>
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

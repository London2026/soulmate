'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { VoicePlayer } from '@/components/motion'
import { revealPhoto } from './actions'
import { requestVideoMeeting } from '@/app/profile/actions'
import { maskName, firstNameOnly } from '@/lib/maskName'

export interface ProfileData {
  id: string
  member_id?: string | null
  full_name: string
  age: number
  gender: string
  city: string
  country: string
  religion: string
  mother_tongue: string
  education: string
  occupation: string
  height?: string | null
  weight?: string | null
  blood_group?: string | null
  ethnicity?: string | null
  education_subject?: string | null
  employment_status?: string | null
  marital_status?: string | null
  has_kids?: string | null
  sub_religion?: string | null
  hobby?: string | null
  university?: string | null
  other_qualifications?: string | null
  housing?: string | null
  zodiac_sign?: string | null
  id_verified?: boolean | null
  back_photo_1_url: string | null
  back_photo_2_url: string | null
  voice_url: string | null
  voice_native_url?: string | null
  front_photo_url: string | null
  front_photo_blurred_url?: string | null
  has_front_photo?: boolean
  already_revealed: boolean
  meeting_room_id: string | null
  meeting_status: string | null
  fav_reels?: string | null
  fav_youtube?: string | null
  fav_web_series?: string | null
  fav_travel?: string | null
  fav_foods?: string | null
  fav_ai_tools?: string | null
  looking_for?: string | null
  sexual_orientation?: string | null
  pref_gender?: string | null
  pref_age_min?: number | null
  pref_age_max?: number | null
  pref_location?: string | null
  pref_religion?: string | null
  pref_sub_religion?: string | null
  pref_occupation?: string | null
  pref_height?: string | null
  pref_ethnicity?: string | null
  habit_smoking?: string | null
  habit_drinking?: string | null
  habit_drugs?: string | null
  habit_betting?: string | null
  is_liked?: boolean
  is_mutual?: boolean
}

const c = {
  navy: '#0d1f3c', navyMid: '#1e3d6e', navyLight: '#1e3d6e',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
  gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.2)',
  borderSub: 'rgba(201,168,76,0.1)',
}

function isPersonalityUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim()) || /^(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|vimeo\.com)/i.test(s.trim())
}

function toFullUrl(s: string): string {
  if (/^https?:\/\//i.test(s.trim())) return s.trim()
  return 'https://' + s.trim()
}

function shortLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 28 ? u.pathname.slice(0, 28) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch {
    return url.length > 40 ? url.slice(0, 40) + '…' : url
  }
}

function splitChips(value: string): string[] {
  if (!value) return []
  if (value.includes(' | ')) return value.split(' | ').map(s => s.trim()).filter(Boolean)
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f5f0e6' }}>{title}</span>
    </div>
  )
}

function LockedPhotoPanel({ backgroundUrl, children }: { backgroundUrl?: string | null; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4', background: c.navyMid, marginBottom: '0.85rem' }}>
      {backgroundUrl && (
        <img src={backgroundUrl} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,31,60,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>🔒</span>
        {children}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="pc-detail-row">
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', fontWeight: 700, color: '#f5f0e6', lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', fontWeight: 500, color: '#f5f0e6', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

export default function ProfileCard({ profile, canReveal = true, canMeet = true, meetingsLeft = 0, previewMode = false, onLike, likesLeft = 0, revealsLeft = null }: {
  profile: ProfileData; canReveal?: boolean; canMeet?: boolean; meetingsLeft?: number; previewMode?: boolean
  onLike?: () => void; likesLeft?: number; revealsLeft?: number | null
}) {
  const [revealed, setRevealed] = useState(profile.already_revealed)
  const [frontUrl, setFrontUrl] = useState<string | null>(profile.front_photo_url)
  const [revealing, setRevealing] = useState(false)
  const [revealMsg, setRevealMsg] = useState('')
  const [revealError, setRevealError] = useState('')
  const [meetDate, setMeetDate] = useState('')
  const [meetTime, setMeetTime] = useState('')
  const [meetMsg, setMeetMsg] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [meetSent, setMeetSent] = useState(false)
  const [meetError, setMeetError] = useState('')
  const [roomId, setRoomId] = useState<string | null>(
    profile.meeting_status === 'accepted' ? profile.meeting_room_id : null
  )
  const [meetPending] = useState(profile.meeting_status === 'pending')

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()

  async function handleReveal() {
    setRevealing(true); setRevealError('')
    try {
      const { signedUrl } = await revealPhoto(profile.id)
      setRevealed(true); setFrontUrl(signedUrl)
      setRevealMsg(`${firstNameOnly(profile.full_name)} has been notified.`)
    } catch (err) { setRevealError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setRevealing(false) }
  }

  async function handleMeetRequest() {
    if (!meetDate || !meetTime) { setMeetError('Please select a date and time.'); return }
    setRequesting(true); setMeetError('')
    try {
      await requestVideoMeeting(profile.id, meetDate, meetTime, meetMsg || `I'd love to connect with you!`)
      setMeetSent(true)
    } catch (err) {
      setMeetError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setRequesting(false) }
  }

  const personalityItems = [
    { icon: '🎬', label: 'My Favourite Reels',            value: profile.fav_reels },
    { icon: '▶️', label: 'My Favourite YouTube Channel',  value: profile.fav_youtube },
    { icon: '📺', label: 'My Favourite Web Series',       value: profile.fav_web_series },
    { icon: '✈️', label: 'My Favourite Travel',           value: profile.fav_travel },
    { icon: '🍽️', label: 'My Favourite Foods',            value: profile.fav_foods },
    { icon: '🤖', label: 'My Favourite AI Tools',         value: profile.fav_ai_tools },
    { icon: '🎯', label: 'My Hobbies & Interests',        value: profile.hobby },
  ].filter(p => p.value)

  return (
    <article style={{ background: c.navyMid, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
      <style>{`
        .pc-name { font-size: 2rem; }
        .pc-section { padding: 1.75rem 1.75rem 1.25rem; }
        .pc-detail-row { display: grid; grid-template-columns: 44% 1fr; padding: 0.85rem 0; border-bottom: 1px solid rgba(201,168,76,0.08); }
        @media (max-width: 500px) {
          .pc-name { font-size: 1.4rem !important; }
          .pc-section { padding: 1.25rem 1rem 0.9rem !important; }
          .pc-detail-row { grid-template-columns: 1fr !important; gap: 0.2rem !important; padding: 0.65rem 0 !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '1.5rem 1.75rem 1.25rem', background: c.navyMid }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 className="pc-name" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: 0, lineHeight: 1 }}>
              {maskName(profile.full_name)}
            </h2>
            {profile.id_verified && <span title="ID Verified" style={{ fontSize: '1rem', color: '#16a34a' }}>✅</span>}
            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.82rem', fontWeight: 700, color: c.goldLight, background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, padding: '0.22rem 0.65rem', borderRadius: '6px', letterSpacing: '0.08em' }}>
              {profile.member_id ?? '#' + profile.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          {/* Right side: religion badge + like button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, border: `1.5px solid ${c.goldLight}`, padding: '0.35rem 0.9rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              {profile.religion}{profile.sub_religion ? ` · ${profile.sub_religion}` : ''}
            </span>
            {!previewMode && onLike && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {profile.is_mutual && (
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', padding: '0.2rem 0.55rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    Mutual ✓
                  </span>
                )}
                <button
                  onClick={onLike}
                  disabled={!profile.is_liked && likesLeft === 0}
                  title={profile.is_liked ? 'Unlike' : likesLeft === 0 ? 'No likes remaining this month' : 'Like this profile'}
                  style={{ background: 'none', border: `1px solid ${profile.is_liked ? '#e84393' : 'rgba(201,168,76,0.35)'}`, borderRadius: '20px', padding: '0 0.75rem', minHeight: '44px', cursor: profile.is_liked || likesLeft > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: !profile.is_liked && likesLeft === 0 ? 0.45 : 1, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1rem' }}>{profile.is_liked ? '❤️' : '🤍'}</span>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: profile.is_liked ? '#e84393' : c.ivoryDim }}>
                    {profile.is_liked ? 'Liked' : 'Like'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', color: c.ivoryDim, margin: 0 }}>
          {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
        </p>
      </div>

      {/* ── Back Photos ── */}
      {(profile.back_photo_1_url || profile.back_photo_2_url) ? (
        profile.back_photo_1_url && profile.back_photo_2_url ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ aspectRatio: '2/3', overflow: 'hidden' }}>
              <img src={profile.back_photo_1_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ aspectRatio: '2/3', overflow: 'hidden', borderLeft: '3px solid #07111f' }}>
              <img src={profile.back_photo_2_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        ) : (
          <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
            <img src={profile.back_photo_1_url || profile.back_photo_2_url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )
      ) : (
        <div style={{ aspectRatio: '16/9', background: `linear-gradient(135deg, #152d4e 0%, #1e3d66 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '3rem', color: 'rgba(201,168,76,0.25)' }}>{initials}</span>
        </div>
      )}

      {/* ── Voice Introduction ── */}
      {(profile.voice_url || profile.voice_native_url) && (
        <div style={{ padding: '1.5rem 1.75rem', background: c.navyMid, borderTop: '3px solid #07111f' }}>
          <SectionHeader icon="🎙" title="Voice Introduction" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {profile.voice_native_url && (
              <div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.5rem', opacity: 0.85 }}>🇮🇳 Mother Tongue</p>
                <VoicePlayer src={profile.voice_native_url} accent={c.goldLight} />
              </div>
            )}
            {profile.voice_url && (
              <div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.5rem', opacity: 0.85 }}>🇬🇧 English</p>
                <VoicePlayer src={profile.voice_url} accent={c.goldLight} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Personal Details ── */}
      <div className="pc-section" style={{ background: c.navyMid, borderTop: '3px solid #07111f' }}>
        <SectionHeader icon="🧑" title="Personal Details" />
        <div>
          <DetailRow label="Sexual Orientation" value={profile.sexual_orientation} />
          <DetailRow label="Mother Tongue"  value={profile.mother_tongue} />
          <DetailRow label="Height"         value={profile.height} />
          <DetailRow label="Weight"         value={profile.weight} />
          <DetailRow label="Blood Group"    value={profile.blood_group} />
          <DetailRow label="Marital Status" value={profile.marital_status} />
          <DetailRow label="Children"       value={profile.has_kids} />
          <DetailRow label="Ethnicity"      value={profile.ethnicity} />
          <DetailRow label="Zodiac Sign"    value={profile.zodiac_sign} />
        </div>
      </div>

      {/* ── Lifestyle & Habits ── */}
      {[profile.habit_smoking, profile.habit_drinking, profile.habit_drugs, profile.habit_betting].some(Boolean) && (
        <div className="pc-section" style={{ background: c.navyLight, borderTop: '3px solid #07111f' }}>
          <SectionHeader icon="🌿" title="Lifestyle & Habits" />
          <div>
            <DetailRow label="🚬 Smoking"            value={profile.habit_smoking} />
            <DetailRow label="🍷 Drinking"           value={profile.habit_drinking} />
            <DetailRow label="💊 Recreational Drugs" value={profile.habit_drugs} />
            <DetailRow label="🎰 Gambling"           value={profile.habit_betting} />
          </div>
        </div>
      )}

      {/* ── Education & Career ── */}
      <div className="pc-section" style={{ background: c.navyLight, borderTop: '3px solid #07111f' }}>
        <SectionHeader icon="🎓" title="Education & Career" />
        <div>
          <DetailRow label="Education Level"          value={profile.education} />
          <DetailRow label="Subject / Specialisation" value={profile.education_subject} />
          <DetailRow label="Other Qualifications"     value={profile.other_qualifications} />
          <DetailRow label="Employment Status"        value={profile.employment_status} />
          <DetailRow label="Occupation"               value={profile.occupation} />
          <DetailRow label="Housing"                  value={profile.housing} />
        </div>
      </div>

      {/* ── Looking For ── */}
      {[profile.looking_for, profile.pref_gender, profile.pref_age_min, profile.pref_location, profile.pref_religion, profile.pref_occupation, profile.pref_height, profile.pref_ethnicity].some(Boolean) && (
        <div className="pc-section" style={{ background: c.navyMid, borderTop: '3px solid #07111f' }}>
          <SectionHeader icon="💑" title="Looking For" />
          <div>
            <DetailRow label="Relationship Goal"    value={profile.looking_for} />
            <DetailRow label="Gender"               value={profile.pref_gender} />
            <DetailRow label="Age Range"            value={profile.pref_age_min && profile.pref_age_max ? `${profile.pref_age_min} – ${profile.pref_age_max} years` : null} />
            <DetailRow label="Religion"             value={profile.pref_religion} />
            <DetailRow label="Caste / Sub-Religion" value={profile.pref_sub_religion} />
            <DetailRow label="Location"             value={profile.pref_location} />
            <DetailRow label="Occupation"           value={profile.pref_occupation} />
            <DetailRow label="Preferred Height"     value={profile.pref_height} />
            <DetailRow label="Ethnicity"            value={profile.pref_ethnicity} />
          </div>
        </div>
      )}

      {/* ── Personality & Interests ── */}
      {personalityItems.length > 0 && (
        <div className="pc-section" style={{ background: c.navyMid, borderTop: '3px solid #07111f' }}>
          <SectionHeader icon="✦" title="Personality & Interests" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {personalityItems.map(p => (
              <div key={p.label}>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{p.icon}</span>{p.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {splitChips(p.value!).map((chip, i) => (
                    isPersonalityUrl(chip) ? (
                      <a key={i} href={toFullUrl(chip)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: '#7fb3f5', padding: '0.5rem 1rem', background: 'rgba(14,26,53,0.6)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '8px', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortLabel(toFullUrl(chip))}
                      </a>
                    ) : (
                      <span key={i}
                        style={{ display: 'block', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, padding: '0.5rem 1rem', background: 'rgba(14,26,53,0.6)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '8px' }}>
                        {chip}
                      </span>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Face Reveal + Meeting ── */}
      {!previewMode && (
        <div style={{ padding: '1.5rem 1.75rem', background: c.navyLight, borderTop: '3px solid #07111f' }}>
          {/* Reveal section */}
          {!canReveal && !revealed ? (
            <div style={{ padding: '0.5rem 0 1rem' }}>
              <LockedPhotoPanel backgroundUrl={profile.front_photo_blurred_url ?? profile.back_photo_1_url}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#f5f0e6', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  {revealsLeft === 0
                    ? "You've used all 5 photo reveals for this month."
                    : 'Face reveal requires a paid plan.'}
                </p>
              </LockedPhotoPanel>
              <div style={{ textAlign: 'center' }}>
                <a href="/pricing" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', border: `1px solid ${c.border}`, padding: '0 1.25rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
                  {revealsLeft === 0 ? 'Upgrade for Unlimited Reveals →' : 'Upgrade Plan →'}
                </a>
              </div>
            </div>
          ) : !profile.has_front_photo && !revealed && canReveal ? (
            <div style={{ padding: '0.5rem 0 1rem' }}>
              <LockedPhotoPanel backgroundUrl={profile.front_photo_blurred_url ?? profile.back_photo_1_url}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#f5f0e6', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  {firstNameOnly(profile.full_name)} hasn&apos;t uploaded their reveal photo yet
                </p>
              </LockedPhotoPanel>
            </div>
          ) : revealed && frontUrl ? (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.75rem', textAlign: 'center' }}>✦ Reveal Photo</p>
              <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4' }}>
                <motion.img
                  src={frontUrl} alt={profile.full_name}
                  initial={{ filter: 'blur(26px)', scale: 1.08, opacity: 0.75 }}
                  animate={{ filter: 'blur(0px)', scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              {revealMsg && <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, textAlign: 'center', margin: '0.75rem 0 0', padding: '0.65rem', background: 'rgba(201,168,76,0.06)', borderRadius: '4px' }}>✓ {revealMsg}</p>}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <LockedPhotoPanel backgroundUrl={profile.front_photo_blurred_url ?? profile.back_photo_1_url}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#f5f0e6', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  Face photo is hidden. Revealing notifies {firstNameOnly(profile.full_name)} instantly.
                </p>
              </LockedPhotoPanel>
              {revealsLeft !== null && (
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: revealsLeft <= 1 ? '#f87171' : c.ivoryDim, margin: '0 0 0.5rem' }}>
                  {revealsLeft} photo reveal{revealsLeft !== 1 ? 's' : ''} remaining this month
                </p>
              )}
              {revealError && <p style={{ color: '#F87171', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{revealError}</p>}
              <motion.button onClick={handleReveal} disabled={revealing}
                whileHover={revealing ? undefined : { backgroundColor: 'rgba(201,168,76,0.1)', boxShadow: '0 0 22px rgba(201,168,76,0.35)' }}
                whileTap={revealing ? undefined : { scale: 0.98 }}
                style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: `1px solid ${c.goldLight}`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: revealing ? 'default' : 'pointer', borderRadius: '6px', opacity: revealing ? 0.6 : 1 }}>
                {revealing ? 'Revealing…' : '🔓 Reveal Photo'}
              </motion.button>
            </div>
          )}

          {/* Meeting section */}
          <div>
            {!canMeet ? (
              <a href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, border: '1px solid rgba(90,110,130,0.2)', textDecoration: 'none', background: 'rgba(90,110,130,0.05)', boxSizing: 'border-box' }}>
                🔒 Upgrade to request meetings
              </a>
            ) : canMeet && !profile.is_mutual && !roomId && !meetPending && !meetSent ? (
              <div style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '8px' }}>
                <p style={{ fontSize: '1.4rem', margin: '0 0 0.3rem' }}>🤍</p>
                <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.3rem' }}>Mutual like required</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: 0 }}>Like this profile — if they like you back, you will both be able to request a video meeting.</p>
              </div>
            ) : canMeet && meetingsLeft === 0 && !roomId && !meetPending && !meetSent ? (
              <div style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '8px' }}>
                <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.3rem' }}>No meeting requests left</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.75rem' }}>Purchase additional meetings to continue</p>
                <a href="/pricing" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', border: `1px solid ${c.border}`, padding: '0.45rem 1rem', borderRadius: '4px' }}>Buy More →</a>
              </div>
            ) : roomId ? (
              <a href={`/meeting/${roomId}`} style={{ display: 'block', textAlign: 'center', padding: '0.85rem', background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.35))', border: `1px solid ${c.goldLight}`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none' }}>
                🎥 Join Video Meeting
              </a>
            ) : meetPending ? (
              <p style={{ textAlign: 'center', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: 0 }}>⏳ Meeting request pending…</p>
            ) : meetSent ? (
              <p style={{ textAlign: 'center', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#4ade80', margin: 0 }}>✓ Meeting request sent!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, margin: 0 }}>📅 Request a Video Meeting</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)}
                    style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)}
                    style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <textarea value={meetMsg} onChange={e => setMeetMsg(e.target.value)} rows={2} placeholder="Add a personal message (optional)…"
                  style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '6px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                {meetError && <p style={{ color: '#F87171', fontSize: '0.85rem', margin: 0 }}>{meetError}</p>}
                <motion.button onClick={handleMeetRequest} disabled={requesting}
                  whileHover={requesting ? undefined : { backgroundColor: 'rgba(201,168,76,0.1)', boxShadow: '0 0 22px rgba(201,168,76,0.35)' }}
                  whileTap={requesting ? undefined : { scale: 0.98 }}
                  style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: `1px solid ${c.goldLight}`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: requesting ? 'default' : 'pointer', borderRadius: '6px', opacity: requesting ? 0.6 : 1 }}>
                  {requesting ? 'Sending…' : '📅 Send Meeting Request'}
                </motion.button>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.78rem', color: c.ivoryDim, margin: 0, textAlign: 'center' }}>
                  {meetingsLeft} meeting request{meetingsLeft !== 1 ? 's' : ''} remaining
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {previewMode && (
        <div style={{ borderTop: '3px solid #07111f' }}>
          {/* Blurred face photo preview */}
          {profile.front_photo_url ? (
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img
                src={profile.front_photo_url}
                alt=""
                style={{ width: '100%', display: 'block', filter: 'blur(18px)', transform: 'scale(1.08)', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,31,60,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>🔒</span>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: '#f5f0e6', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  Your face photo — blurred as others see it
                </p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem 1.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🔒</span>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0.5rem 0 0' }}>
                Upload a face photo in your profile to see the preview here.
              </p>
            </div>
          )}
          {/* Explanation box */}
          <div style={{ margin: '1.25rem 1.75rem 1.5rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, margin: 0, lineHeight: 1.65 }}>
              This is exactly how other members see your face photo — blurred until they choose to reveal it. When they click &ldquo;Reveal Face Photo&rdquo;, you will be notified immediately.
            </p>
          </div>
        </div>
      )}
    </article>
  )
}

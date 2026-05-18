'use client'

import { useState } from 'react'
import { revealPhoto } from './actions'
import { requestVideoMeeting } from '@/app/profile/actions'

export interface ProfileData {
  id: string
  full_name: string
  age: number
  gender: string
  city: string
  country: string
  religion: string
  mother_tongue: string
  education: string
  occupation: string
  back_photo_1_url: string | null
  back_photo_2_url: string | null
  voice_url: string | null
  front_photo_url: string | null
  already_revealed: boolean
  meeting_room_id: string | null
}

const c = {
  navy: '#0d1f3c', navyMid: '#152240', navyLight: '#1a2b4a',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
  gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.18)',
}

export default function ProfileCard({ profile, canReveal = true, canMeet = true }: {
  profile: ProfileData; canReveal?: boolean; canMeet?: boolean
}) {
  const [revealed, setRevealed] = useState(profile.already_revealed)
  const [frontUrl, setFrontUrl] = useState<string | null>(profile.front_photo_url)
  const [revealing, setRevealing] = useState(false)
  const [revealMsg, setRevealMsg] = useState('')
  const [revealError, setRevealError] = useState('')
  const [roomId, setRoomId] = useState<string | null>(profile.meeting_room_id)
  const [requesting, setRequesting] = useState(false)

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()

  async function handleReveal() {
    if (revealed || revealing) return
    setRevealing(true); setRevealError('')
    try {
      const { signedUrl } = await revealPhoto(profile.id)
      setFrontUrl(signedUrl); setRevealed(true)
      setRevealMsg(`${profile.full_name.split(' ')[0]} has been notified.`)
    } catch (err) { setRevealError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setRevealing(false) }
  }

  async function handleRequestMeeting() {
    setRequesting(true)
    try { const { roomId: r } = await requestVideoMeeting(profile.id); setRoomId(r) }
    finally { setRequesting(false) }
  }

  const tags = [profile.occupation, profile.education, profile.mother_tongue].filter(Boolean)

  return (
    <article style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.45)', marginBottom: '2rem' }}>

      {/* Header */}
      <div style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: `1px solid rgba(201,168,76,0.08)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.25rem' }}>
              {profile.full_name}
            </h2>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivoryDim, margin: 0 }}>
              {profile.age} yrs · {profile.city}, {profile.country}
            </p>
          </div>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.25rem 0.75rem', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, color: c.goldLight, borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {profile.religion}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', padding: '0.2rem 0.6rem', background: 'rgba(14,26,53,0.7)', border: '1px solid rgba(201,168,76,0.1)', color: c.ivoryDim, borderRadius: '3px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Back Photos */}
      {profile.back_photo_1_url || profile.back_photo_2_url ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[profile.back_photo_1_url, profile.back_photo_2_url].map((url, i) =>
            url ? (
              <div key={i} style={{ aspectRatio: '4/3', background: c.navy, overflow: 'hidden' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', background: `linear-gradient(135deg, ${c.navy} 0%, ${c.navyLight} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.3)' }}>{initials}</span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.2)' }}>Photo coming soon</span>
            </div>
          ))}
        </div>
      )}

      {/* Voice */}
      {profile.voice_url && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,168,76,0.07)' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.5rem' }}>🎙 Voice Introduction</p>
          <audio controls src={profile.voice_url} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
        </div>
      )}

      {/* Gold divider */}
      <div style={{ height: '1px', margin: '0 1.5rem', background: `linear-gradient(to right, transparent, ${c.border}, transparent)` }} />

      {/* Reveal section */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        {!canReveal && !revealed ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(90,110,130,0.1)', border: '1px solid rgba(90,110,130,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.5rem' }}>🔒</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.75rem' }}>Face reveal requires a paid plan</p>
            <a href="/pricing" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', border: `1px solid ${c.border}`, padding: '0.5rem 1.25rem', borderRadius: '4px' }}>
              Upgrade Plan →
            </a>
          </div>
        ) : !profile.front_photo_url && !revealed && canReveal ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.5rem' }}>🔒</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: 0 }}>
              {profile.full_name.split(' ')[0]} hasn&apos;t uploaded their reveal photo yet
            </p>
          </div>
        ) : revealed && frontUrl ? (
          <div>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, textAlign: 'center', margin: '0 0 0.75rem' }}>✦ Reveal Photo</p>
            <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4' }}>
              <img src={frontUrl} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            {revealMsg && (
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, textAlign: 'center', margin: '0.75rem 0 0', padding: '0.65rem', background: 'rgba(201,168,76,0.06)', borderRadius: '4px' }}>
                ✓ {revealMsg}
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.75rem' }}>🔒</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.75rem' }}>
              Face photo is hidden. Revealing notifies {profile.full_name.split(' ')[0]} instantly.
            </p>
            {revealError && <p style={{ color: '#F87171', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{revealError}</p>}
            <button onClick={handleReveal} disabled={revealing}
              style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: `1px solid ${c.goldLight}`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: revealing ? 'default' : 'pointer', borderRadius: '6px', transition: 'all 0.2s', opacity: revealing ? 0.6 : 1 }}>
              {revealing ? 'Revealing…' : '🔓 Reveal Photo'}
            </button>
          </div>
        )}

        {/* Meeting button */}
        {!canMeet ? (
          <a href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', width: '100%', padding: '0.75rem', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, border: '1px solid rgba(90,110,130,0.2)', textDecoration: 'none', background: 'rgba(90,110,130,0.05)', boxSizing: 'border-box' }}>
            🔒 Upgrade to request meetings
          </a>
        ) : roomId ? (
          <a href={`https://meet.jit.si/SoulMate-${roomId}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', width: '100%', padding: '0.75rem', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.navy, background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, textDecoration: 'none', boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>
            🎥 Join Video Meeting
          </a>
        ) : (
          <button onClick={handleRequestMeeting} disabled={requesting}
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: 'transparent', border: `1px solid rgba(201,168,76,0.3)`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: requesting ? 'default' : 'pointer', borderRadius: '6px', opacity: requesting ? 0.6 : 1 }}>
            {requesting ? 'Sending…' : '📹 Request Video Meeting'}
          </button>
        )}
      </div>
    </article>
  )
}

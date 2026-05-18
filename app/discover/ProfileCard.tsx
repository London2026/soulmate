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

export default function ProfileCard({ profile, canReveal = true, canMeet = true }: { profile: ProfileData; canReveal?: boolean; canMeet?: boolean }) {
  const [revealed, setRevealed] = useState(profile.already_revealed)
  const [frontUrl, setFrontUrl] = useState<string | null>(profile.front_photo_url)
  const [revealing, setRevealing] = useState(false)
  const [revealMsg, setRevealMsg] = useState('')
  const [revealError, setRevealError] = useState('')
  const [roomId, setRoomId] = useState<string | null>(profile.meeting_room_id)
  const [requesting, setRequesting] = useState(false)

  async function handleReveal() {
    if (revealed || revealing) return
    setRevealing(true)
    setRevealError('')
    try {
      const { signedUrl } = await revealPhoto(profile.id)
      setFrontUrl(signedUrl)
      setRevealed(true)
      setRevealMsg(`${profile.full_name} has been notified that you revealed their photo.`)
    } catch (err) {
      setRevealError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setRevealing(false)
    }
  }

  async function handleRequestMeeting() {
    setRequesting(true)
    try {
      const { roomId: newRoom } = await requestVideoMeeting(profile.id)
      setRoomId(newRoom)
    } finally {
      setRequesting(false)
    }
  }

  const backPhotos = [profile.back_photo_1_url, profile.back_photo_2_url].filter(Boolean) as string[]

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--oxford-navy-mid)',
        border: '1px solid rgba(201,168,76,0.18)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
      }}
    >
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl leading-tight"
              style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}
            >
              {profile.full_name}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ivory-dim)' }}>
              {profile.age} yrs · {profile.city}, {profile.country}
            </p>
          </div>
          <span
            className="shrink-0 text-xs px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(201,168,76,0.08)',
              color: 'var(--antique-gold)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            {profile.religion}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {[profile.occupation, profile.education, profile.mother_tongue]
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded"
                style={{
                  backgroundColor: 'rgba(14,26,53,0.7)',
                  color: 'var(--ivory-dim)',
                  border: '1px solid rgba(201,168,76,0.1)',
                }}
              >
                {tag}
              </span>
            ))}
        </div>
      </div>

      {/* ── Back Photos ── */}
      {backPhotos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: backPhotos.length === 2 ? '1fr 1fr' : '1fr', gap: '2px' }}>
          {backPhotos.map((url, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '4/3', background: '#0a1628' }}>
              <img src={url} alt={`Back photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      ) : (
        /* Placeholder when no photos uploaded yet */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', background: `linear-gradient(135deg, #0d1f3c 0%, #1a2b4a 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.35)' }}>
                {profile.full_name.split(' ').map(n => n[0]).join('')}
              </span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.25)' }}>
                Photo coming soon
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Voice Introduction ── */}
      {profile.voice_url && (
        <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(201,168,76,0.07)' }}>
          <p
            className="text-xs mb-2 tracking-widest uppercase"
            style={{ color: 'var(--antique-gold)' }}
          >
            🎙 Voice Introduction
          </p>
          <audio
            controls
            src={profile.voice_url}
            preload="none"
            className="w-full"
            style={{ accentColor: 'var(--antique-gold)', height: '36px' }}
          />
        </div>
      )}

      {/* ── Gold Divider ── */}
      <div
        className="mx-6"
        style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)' }}
      />

      {/* ── Reveal Section ── */}
      <div className="px-6 py-5">
        {!profile.front_photo_url && !revealed && canReveal ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.5rem' }}>🔒</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ivory-dim)', fontStyle: 'italic', fontFamily: '"Cormorant Garamond", serif' }}>
              {profile.full_name.split(' ')[0]} hasn&apos;t uploaded their reveal photo yet
            </p>
          </div>
        ) : !canReveal && !revealed ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(90,110,130,0.1)', border: '1px solid rgba(90,110,130,0.2)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>🔒</div>
            <p className="text-xs" style={{ color: 'var(--ivory-dim)', marginBottom: '0.5rem' }}>Face reveal requires a paid plan</p>
            <a href="/pricing" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--antique-gold)', textDecoration: 'none', border: '1px solid rgba(201,168,76,0.35)', padding: '0.5rem 1rem', borderRadius: '4px', display: 'inline-block' }}>
              Upgrade Plan →
            </a>
          </div>
        ) : revealed && frontUrl ? (
          <div className="space-y-4">
            <p
              className="text-xs text-center tracking-widest uppercase"
              style={{ color: 'var(--antique-gold)' }}
            >
              ✦ Reveal Photo
            </p>
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
              <img
                src={frontUrl}
                alt={`${profile.full_name}`}
                className="w-full h-full object-cover"
              />
            </div>
            {revealMsg && (
              <p className="text-xs text-center py-2 rounded-lg"
                style={{ color: 'var(--ivory-dim)', backgroundColor: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                ✓ {revealMsg}
              </p>
            )}

            {/* Video meeting button — appears after reveal */}
            <div className="pt-1">
              {!canMeet ? (
                <a href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '8px', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ivory-dim)', border: '1px solid rgba(90,110,130,0.2)', textDecoration: 'none', background: 'rgba(90,110,130,0.05)' }}>
                  🔒 Upgrade to request meetings
                </a>
              ) : roomId ? (
                <a
                  href={`https://meet.jit.si/SoulMate-${roomId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold tracking-wider transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
                    color: 'var(--oxford-navy)',
                    boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
                  }}
                >
                  🎥 Join Video Meeting
                </a>
              ) : (
                <button
                  onClick={handleRequestMeeting}
                  disabled={requesting}
                  className="w-full py-3 rounded-xl text-sm font-medium tracking-wider transition-all disabled:opacity-60"
                  style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--antique-gold)', backgroundColor: 'rgba(201,168,76,0.04)' }}
                >
                  {requesting ? 'Sending request…' : '📹 Request Video Meeting'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div
              className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)' }}
            >
              🔒
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ivory-dim)' }}>
              Face photo is hidden. Revealing it will send {profile.full_name} an instant notification.
            </p>

            {revealError && (
              <p className="text-xs" style={{ color: '#F87171' }}>{revealError}</p>
            )}

            <button
              onClick={handleReveal}
              disabled={revealing}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider transition-all duration-200 disabled:opacity-60"
              style={{
                border: '1px solid var(--antique-gold)',
                color: 'var(--antique-gold)',
                backgroundColor: revealing ? 'rgba(201,168,76,0.1)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!revealing) e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.1)' }}
              onMouseLeave={(e) => { if (!revealing) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {revealing ? 'Revealing…' : '🔓 Reveal Photo'}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

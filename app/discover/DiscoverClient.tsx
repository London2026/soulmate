'use client'

import { useState, useMemo } from 'react'
import ProfileCard, { type ProfileData } from './ProfileCard'
import { maskName } from '@/lib/maskName'

const c = {
  page: '#07111f', card: '#1e3358', border: 'rgba(201,168,76,0.25)',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', gold: '#c9a84c', navy: '#0d1f3c',
  sepia: '#5a6e82',
}

interface AIMatch { id: string; score: number; reasons: string[]; profile: ProfileData }

function profileId(id: string) {
  return '#' + id.slice(0, 8).toUpperCase()
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Exceptional Match'
  if (score >= 75) return 'Strong Match'
  if (score >= 60) return 'Good Match'
  return 'Potential Match'
}

function scoreColor(score: number) {
  if (score >= 80) return '#4ade80'
  if (score >= 60) return '#c9a84c'
  return '#f87171'
}

function scoreGradient(score: number) {
  if (score >= 80) return 'linear-gradient(to right, #4ade80, #22c55e)'
  if (score >= 60) return 'linear-gradient(to right, #e8c876, #c9a84c)'
  return 'linear-gradient(to right, #f87171, #ef4444)'
}

export default function DiscoverClient({
  profiles, canReveal, canMeet,
}: {
  profiles: ProfileData[]; canReveal: boolean; canMeet: boolean
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProfileData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<AIMatch[] | null>(null)
  const [aiError, setAiError] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, '')
    if (!q) return profiles
    return profiles.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      p.id.slice(0, 8).toLowerCase().startsWith(q)
    )
  }, [profiles, search])

  async function handleAiMatch() {
    setAiLoading(true)
    setAiError('')
    setAiMatches(null)
    try {
      const res = await fetch('/api/ai-match', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'AI match failed')
      }
      const { matches } = await res.json()
      setAiMatches(matches)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <>
      {/* Search bar */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: c.sepia, fontSize: '0.9rem' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or Profile ID (e.g. #A0000001)…"
            style={{ width: '100%', padding: '0.75rem 0.9rem 0.75rem 2.4rem', background: c.card, border: `1px solid ${c.border}`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = c.gold)}
            onBlur={e => (e.target.style.borderColor = c.border)}
          />
        </div>
      </div>

      {/* Find My Soul Mate button — full width, centered, prominent */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
        <button onClick={handleAiMatch} disabled={aiLoading}
          style={{
            padding: '1rem 2.5rem',
            background: aiLoading
              ? 'rgba(201,168,76,0.15)'
              : 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.35) 100%)',
            border: `1.5px solid ${c.gold}`,
            color: c.gold,
            fontFamily: 'Raleway, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: '10px',
            cursor: aiLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: aiLoading ? 'none' : '0 0 28px rgba(201,168,76,0.18)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!aiLoading) { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(201,168,76,0.32)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(201,168,76,0.18)'; (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}>
          {aiLoading ? (
            <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '1rem' }}>✦</span> Analysing your profile…</>
          ) : (
            <><span style={{ fontSize: '1.1rem' }}>✨</span> Find My Soul Mate</>
          )}
        </button>
      </div>

      {/* AI error */}
      {aiError && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem' }}>
          {aiError}
        </div>
      )}

      {/* AI Match Results — proper English with Profile IDs */}
      {aiMatches && (
        <div style={{ marginBottom: '2rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid rgba(201,168,76,0.12)`, background: 'linear-gradient(to right, rgba(201,168,76,0.08), transparent)' }}>
            <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>
              ✨ Your Soul Mate Matches
            </p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.sepia, margin: 0 }}>
              Based on your profile, values, and interests — click any result to view their full profile
            </p>
          </div>

          {aiMatches.map((m, i) => (
            <div key={m.id} onClick={() => setSelected(m.profile)}
              style={{ padding: '1.25rem 1.5rem', borderBottom: i < aiMatches.length - 1 ? `1px solid rgba(201,168,76,0.08)` : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              {/* Match headline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.95rem', fontWeight: 900, color: c.gold, letterSpacing: '0.1em', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  {profileId(m.id)}
                </span>
                <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, fontSize: '1rem' }}>
                  {maskName(m.profile?.full_name ?? '')}
                </span>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.sepia }}>
                  {m.profile?.age} yrs · {m.profile?.city}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', color: scoreColor(m.score), background: `${scoreColor(m.score)}18`, border: `1px solid ${scoreColor(m.score)}40`, padding: '0.2rem 0.55rem', borderRadius: '20px' }}>
                  {scoreLabel(m.score)}
                </span>
              </div>

              {/* Score bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                  <div style={{ height: '100%', width: `${m.score}%`, background: scoreGradient(m.score), borderRadius: '3px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: scoreColor(m.score), minWidth: '52px', textAlign: 'right' }}>
                  {m.score}/100
                </span>
              </div>

              {/* Narrative sentence */}
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: '0 0 0.6rem', lineHeight: 1.6 }}>
                Profile {profileId(m.id)} is matching your profile with a compatibility score of <strong style={{ color: scoreColor(m.score), fontStyle: 'normal' }}>{m.score} out of 100</strong> — a {scoreLabel(m.score).toLowerCase()}. Here is why this profile is well-suited for you:
              </p>

              {/* Reasons */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {m.reasons.map((r, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: c.gold, fontSize: '0.75rem', marginTop: '0.15rem', flexShrink: 0 }}>✦</span>
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.ivoryDim, lineHeight: 1.55 }}>{r}</span>
                  </li>
                ))}
              </ul>

              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em', color: c.gold, textTransform: 'uppercase', margin: '0.75rem 0 0', textAlign: 'right' }}>
                Click to view full profile →
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Profile count */}
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia, letterSpacing: '0.08em', marginBottom: '1rem' }}>
        {filtered.length} {filtered.length === 1 ? 'profile' : 'profiles'}{search ? ' found' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: c.sepia, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
          No profiles match your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {filtered.map(p => (
            <CompactCard key={p.id} profile={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {/* Expanded modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'sticky', top: '0.75rem', float: 'right', marginRight: '0.75rem', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(14,26,53,0.9)', border: `1px solid ${c.border}`, color: c.ivoryDim, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <ProfileCard profile={selected} canReveal={canReveal} canMeet={canMeet} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function CompactCard({ profile, onClick }: { profile: ProfileData; onClick: () => void }) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const pid = '#' + profile.id.slice(0, 8).toUpperCase()
  return (
    <div onClick={onClick}
      style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Photo / initials */}
      {profile.back_photo_1_url ? (
        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
          <img src={profile.back_photo_1_url} alt={maskName(profile.full_name)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2.2rem', color: 'rgba(201,168,76,0.45)' }}>{initials}</span>
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.3rem', marginBottom: '0.2rem' }}>
          <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '0.9rem', color: c.ivory, margin: 0, lineHeight: 1.2 }}>{maskName(profile.full_name)}</p>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em', padding: '0.15rem 0.45rem', background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, color: c.gold, borderRadius: '20px', flexShrink: 0 }}>
            {profile.religion?.slice(0, 6).toUpperCase()}
          </span>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.82rem', color: c.sepia, margin: '0 0 0.35rem' }}>
          {profile.age} · {profile.city}
        </p>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.ivoryDim, margin: '0 0 0.3rem', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile.occupation}
        </p>
        {/* Profile ID — prominent */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px' }}>
          <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', fontWeight: 700, color: c.gold, letterSpacing: '0.08em' }}>{pid}</span>
        </div>
      </div>
    </div>
  )
}

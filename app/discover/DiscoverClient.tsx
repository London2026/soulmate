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
    const q = search.trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      p.id.toLowerCase().startsWith(q) ||
      p.id.slice(0, 8).toLowerCase().includes(q)
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
      {/* Search + AI button */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: c.sepia, fontSize: '0.9rem' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or profile ID…"
            style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.4rem', background: c.card, border: `1px solid ${c.border}`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = c.gold)}
            onBlur={e => (e.target.style.borderColor = c.border)}
          />
        </div>

        {/* AI button */}
        <button onClick={handleAiMatch} disabled={aiLoading}
          style={{ padding: '0.7rem 1.25rem', background: aiLoading ? 'rgba(201,168,76,0.2)' : 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.25))', border: `1px solid ${c.border}`, color: c.gold, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '8px', cursor: aiLoading ? 'default' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {aiLoading ? (
            <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✦</span> Analysing…</>
          ) : '✨ Find My Soul Mate'}
        </button>
      </div>

      {/* AI Match Results */}
      {aiError && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem' }}>
          {aiError}
        </div>
      )}

      {aiMatches && (
        <div style={{ marginBottom: '2rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${c.border}`, background: 'rgba(201,168,76,0.06)' }}>
            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, color: c.ivory, margin: 0 }}>✨ Your AI Soul Mate Matches</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.sepia, margin: '0.2rem 0 0' }}>Ranked by compatibility score — click any card to view full profile</p>
          </div>

          {aiMatches.map((m, i) => (
            <div key={m.id} onClick={() => setSelected(m.profile)}
              style={{ padding: '0.9rem 1.25rem', borderBottom: i < aiMatches.length - 1 ? `1px solid rgba(201,168,76,0.08)` : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 700, color: scoreColor(m.score), minWidth: '44px' }}>{m.score}</span>
                {/* Score bar */}
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                  <div style={{ height: '100%', width: `${m.score}%`, background: scoreGradient(m.score), borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: c.ivory, fontSize: '0.95rem' }}>{maskName(m.profile?.full_name ?? '')}</span>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia }}>{m.profile?.age} · {m.profile?.city}</span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 2.5rem', listStyle: 'none' }}>
                {m.reasons.map((r, j) => (
                  <li key={j} style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.88rem', color: c.ivoryDim, marginBottom: '0.1rem' }}>
                    ✦ {r}
                  </li>
                ))}
              </ul>
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
  const initials = profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div onClick={onClick}
      style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Photo / initials */}
      {profile.back_photo_1_url ? (
        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
          <img src={profile.back_photo_1_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2.2rem', color: 'rgba(201,168,76,0.45)' }}>{initials}</span>
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.3rem', marginBottom: '0.25rem' }}>
          <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '0.9rem', color: c.ivory, margin: 0, lineHeight: 1.2 }}>{maskName(profile.full_name)}</p>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em', padding: '0.15rem 0.45rem', background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, color: c.gold, borderRadius: '20px', flexShrink: 0 }}>
            {profile.religion?.slice(0, 6).toUpperCase()}
          </span>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.82rem', color: c.sepia, margin: '0 0 0.4rem' }}>
          {profile.age} · {profile.city}
        </p>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.ivoryDim, margin: 0, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile.occupation}
        </p>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: 'rgba(189,181,166,0.4)', margin: '0.3rem 0 0', letterSpacing: '0.06em' }}>
          ID: {profile.id.slice(0, 8)}
        </p>
      </div>
    </div>
  )
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

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

function profileId(id: string) { return '#' + id.slice(0, 8).toUpperCase() }

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

const NEGATIVE_SIGNALS = [
  'mismatch', 'outside', 'incompatible', 'reduces', 'limits', 'significantly limit',
  'barrier', 'gap', 'doesn\'t', 'does not', 'places him', 'places her', 'falls outside',
  'well outside', 'notable', 'despite', 'however', 'though', 'incompatibility',
]

function isPositiveReason(reason: string) {
  const lower = reason.toLowerCase()
  return !NEGATIVE_SIGNALS.some(s => lower.includes(s))
}

export default function DiscoverClient({
  profiles, canReveal, canMeet, meetingsLeft, myProfile,
}: {
  profiles: ProfileData[]; canReveal: boolean; canMeet: boolean; meetingsLeft: number; myProfile: ProfileData | null
}) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fLocation, setFLocation] = useState('')
  const [fAgeMin, setFAgeMin] = useState('')
  const [fAgeMax, setFAgeMax] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fEducation, setFEducation] = useState('')
  const [fOccupation, setFOccupation] = useState('')
  const [selected, setSelected] = useState<ProfileData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<AIMatch[] | null>(null)
  const [aiError, setAiError] = useState('')

  const activeFilterCount = [fLocation, fAgeMin, fAgeMax, fReligion, fEducation, fOccupation].filter(Boolean).length

  function clearFilters() {
    setFLocation(''); setFAgeMin(''); setFAgeMax('')
    setFReligion(''); setFEducation(''); setFOccupation('')
  }

  // Unique values from loaded profiles for dropdowns
  const religions  = useMemo(() => [...new Set(profiles.map(p => p.religion).filter(Boolean))].sort(), [profiles])
  const educations = useMemo(() => [...new Set(profiles.map(p => p.education).filter(Boolean))].sort(), [profiles])

  const filtered = useMemo(() => {
    let list = profiles
    const q = search.trim().toLowerCase().replace(/^#/, '')
    if (q) list = list.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      p.id.slice(0, 8).toLowerCase().startsWith(q)
    )
    if (fLocation) list = list.filter(p =>
      p.city?.toLowerCase().includes(fLocation.toLowerCase()) ||
      p.country?.toLowerCase().includes(fLocation.toLowerCase())
    )
    if (fAgeMin) list = list.filter(p => p.age >= parseInt(fAgeMin))
    if (fAgeMax) list = list.filter(p => p.age <= parseInt(fAgeMax))
    if (fReligion) list = list.filter(p => p.religion === fReligion)
    if (fEducation) list = list.filter(p => p.education === fEducation)
    if (fOccupation) list = list.filter(p =>
      p.occupation?.toLowerCase().includes(fOccupation.toLowerCase())
    )
    return list
  }, [profiles, search, fLocation, fAgeMin, fAgeMax, fReligion, fEducation, fOccupation])

  async function handleAiMatch() {
    setAiLoading(true); setAiError(''); setAiMatches(null)
    try {
      const res = await fetch('/api/ai-match', { method: 'POST' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'AI match failed') }
      const { matches } = await res.json()
      setAiMatches(matches)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setAiLoading(false) }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .disc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .disc-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .disc-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
        }
        @media (max-width: 360px) {
          .disc-grid { grid-template-columns: 1fr; }
        }

        .ai-btn {
          padding: 1rem 2.5rem;
          display: flex; align-items: center; gap: 0.6rem;
          transition: all 0.2s;
        }
        @media (max-width: 600px) {
          .ai-btn { width: 100%; justify-content: center; padding: 0.95rem 1rem; }
        }

        .disc-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.88);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          overflow-y: auto;
        }
        @media (max-width: 600px) {
          .disc-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .disc-modal-inner {
            max-height: 92vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }

        .disc-match-headline {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 0.6rem; flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .disc-match-headline { gap: 0.4rem; }
          .disc-score-label { margin-left: 0 !important; }
        }

        .compact-card-info { padding: 0.85rem; }
        .compact-card-name { font-size: 1.1rem; }
        .compact-card-sub { font-size: 0.95rem; }
        .compact-card-occ { font-size: 0.78rem; }
        .compact-card-rel { font-size: 0.65rem; }
        .compact-card-pid { font-size: 0.7rem; }
        @media (max-width: 500px) {
          .compact-card-info { padding: 0.6rem; }
          .compact-card-name { font-size: 0.95rem !important; }
          .compact-card-sub { font-size: 0.82rem !important; }
          .compact-card-occ { font-size: 0.68rem !important; }
          .compact-card-rel { font-size: 0.58rem !important; }
          .compact-card-pid { font-size: 0.62rem !important; }
        }

        /* Filter input placeholder text */
        .disc-filter-inp::placeholder { color: #8a9db5 !important; }
        .disc-filter-inp:focus { border-color: #c9a84c !important; }
        /* Prevent iOS auto-zoom on input focus (requires font-size >= 16px) */
        @media (max-width: 600px) {
          .disc-search-inp, .disc-filter-inp { font-size: 16px !important; }
          .disc-ai-match-score { margin-left: 0 !important; }
        }
      `}</style>

      {/* My profile preview — exactly how other members see your card */}
      {myProfile && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.4rem' }}>
            👁 Your Profile Preview
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: '0 0 1rem' }}>
            This is exactly how other members see your card on Discover.
          </p>
          <div style={{ maxWidth: '420px' }}>
            <ProfileCard profile={myProfile} previewMode />
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(201,168,76,0.3), transparent)', margin: '2rem 0 0' }} />
        </div>
      )}

      {profiles.length === 0 ? (
        <EmptyState />
      ) : (
      <>

      {/* Search bar + filter toggle */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: c.sepia, fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or Profile ID…"
              className="disc-search-inp"
              style={{ width: '100%', padding: '0.75rem 0.9rem 0.75rem 2.4rem', background: c.card, border: `1px solid ${c.border}`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = c.gold)}
              onBlur={e => (e.target.style.borderColor = c.border)}
            />
          </div>
          {/* Filter toggle button */}
          <button onClick={() => setShowFilters(f => !f)}
            style={{ padding: '0.75rem 1.1rem', background: showFilters ? 'rgba(201,168,76,0.18)' : c.card, border: `1px solid ${activeFilterCount > 0 ? c.gold : c.border}`, color: activeFilterCount > 0 ? c.gold : c.sepia, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            ⚙ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ marginTop: '0.6rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>📍 Location</label>
                <input type="text" value={fLocation} onChange={e => setFLocation(e.target.value)}
                  placeholder="City or country…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)} />
              </div>

              {/* Age range */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🎂 Age Range</label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input type="number" min={18} max={99} value={fAgeMin} onChange={e => setFAgeMin(e.target.value)}
                    placeholder="Min" className="disc-filter-inp"
                    style={{ flex: 1, padding: '0.55rem 0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = c.gold)}
                    onBlur={e => (e.target.style.borderColor = c.border)} />
                  <span style={{ color: c.sepia, fontSize: '0.8rem', flexShrink: 0 }}>–</span>
                  <input type="number" min={18} max={99} value={fAgeMax} onChange={e => setFAgeMax(e.target.value)}
                    placeholder="Max" className="disc-filter-inp"
                    style={{ flex: 1, padding: '0.55rem 0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = c.gold)}
                    onBlur={e => (e.target.style.borderColor = c.border)} />
                </div>
              </div>

              {/* Religion */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🕊 Religion</label>
                <select value={fReligion} onChange={e => setFReligion(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fReligion ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any religion</option>
                  {religions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Education */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🎓 Education</label>
                <select value={fEducation} onChange={e => setFEducation(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fEducation ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any level</option>
                  {educations.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>💼 Occupation</label>
                <input type="text" value={fOccupation} onChange={e => setFOccupation(e.target.value)}
                  placeholder="e.g. Engineer, Doctor…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)} />
              </div>

            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={clearFilters}
                  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Find My Banduraa button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
        <button onClick={handleAiMatch} disabled={aiLoading} className="ai-btn"
          style={{
            background: aiLoading ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.35) 100%)',
            border: `1.5px solid ${c.gold}`, color: c.gold,
            fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', borderRadius: '10px',
            cursor: aiLoading ? 'default' : 'pointer',
            boxShadow: aiLoading ? 'none' : '0 0 28px rgba(201,168,76,0.18)',
          }}>
          {aiLoading
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '1rem' }}>✦</span> Analysing your profile…</>
            : <><span style={{ fontSize: '1.1rem' }}>✨</span> Find My Banduraa</>}
        </button>
      </div>

      {/* AI error */}
      {aiError && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem' }}>
          {aiError}
        </div>
      )}

      {/* AI Match Results */}
      {aiMatches && (
        <div style={{ marginBottom: '2rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid rgba(201,168,76,0.12)`, background: 'linear-gradient(to right, rgba(201,168,76,0.08), transparent)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>✨ Your Banduraa Matches</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.sepia, margin: 0 }}>Showing matches with 50+ compatibility · Tap any result to view their full profile</p>
            </div>
            <button
              onClick={() => { setAiMatches(null); setAiError('') }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#bdb5a6', fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              ✕ Close
            </button>
          </div>

          {aiMatches.filter(m => m.score >= 50).map((m, i, arr) => (
            <div key={m.id} onClick={() => setSelected(m.profile)}
              style={{ padding: '1.4rem 1.5rem', borderBottom: i < arr.length - 1 ? `1px solid rgba(201,168,76,0.08)` : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              {/* Match headline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: '"Courier New", monospace', fontSize: '1rem', fontWeight: 900, color: c.gold, letterSpacing: '0.08em', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '0.3rem 0.7rem', borderRadius: '6px' }}>
                  {profileId(m.id)}
                </span>
                <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, fontSize: '1.35rem' }}>
                  {maskName(m.profile?.full_name ?? '')}
                </span>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: c.sepia }}>
                  {m.profile?.age} yrs · {m.profile?.city}
                </span>
                <span className="disc-ai-match-score" style={{ marginLeft: 'auto', fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', color: scoreColor(m.score), background: `${scoreColor(m.score)}18`, border: `1px solid ${scoreColor(m.score)}40`, padding: '0.3rem 0.8rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  {scoreLabel(m.score)}
                </span>
              </div>

              {/* Score bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                  <div style={{ height: '100%', width: `${m.score}%`, background: scoreGradient(m.score), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.35rem', fontWeight: 700, color: scoreColor(m.score), minWidth: '64px', textAlign: 'right' }}>
                  {m.score}/100
                </span>
              </div>

              {/* Narrative */}
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.15rem', color: c.ivoryDim, margin: '0 0 0.8rem', lineHeight: 1.65 }}>
                Profile {profileId(m.id)} matches your profile with a compatibility score of <strong style={{ color: scoreColor(m.score), fontStyle: 'normal' }}>{m.score} out of 100</strong> — a {scoreLabel(m.score).toLowerCase()}. Here is why this is a good match for you:
              </p>

              {/* Reasons */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {m.reasons.map((r, j) => {
                  const positive = isPositiveReason(r)
                  return (
                    <li key={j} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                      padding: positive ? '0.5rem 0.75rem' : '0.35rem 0.5rem',
                      borderRadius: '6px',
                      background: positive ? 'rgba(74,222,128,0.07)' : 'transparent',
                      border: positive ? '1px solid rgba(74,222,128,0.18)' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: '0.85rem', marginTop: '0.2rem', flexShrink: 0 }}>
                        {positive ? '✅' : '⚠️'}
                      </span>
                      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: positive ? '#e8f5e0' : '#bdb5a6', lineHeight: 1.6, fontWeight: positive ? 600 : 400 }}>{r}</span>
                    </li>
                  )
                })}
              </ul>

              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: c.gold, textTransform: 'uppercase', margin: '0.9rem 0 0', textAlign: 'right' }}>
                Tap to view full profile →
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Profile count */}
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia, letterSpacing: '0.08em', marginBottom: '1rem' }}>
        {filtered.length} {filtered.length === 1 ? 'profile' : 'profiles'}{(search || activeFilterCount > 0) ? ' found' : ''}
        {activeFilterCount > 0 && <span style={{ color: c.gold }}> · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: c.sepia, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
          No profiles match your search.
        </div>
      ) : (
        <div className="disc-grid">
          {filtered.map(p => (
            <CompactCard key={p.id} profile={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {/* Expanded modal */}
      {selected && (
        <div className="disc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="disc-modal-inner" style={{ position: 'relative', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'sticky', top: '0.75rem', float: 'right', marginRight: '0.75rem', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,26,53,0.9)', border: `1px solid ${c.border}`, color: c.ivoryDim, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <ProfileCard profile={selected} canReveal={canReveal} canMeet={canMeet} meetingsLeft={meetingsLeft} />
          </div>
        </div>
      )}

      </>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem' }}>
        💘
      </div>
      <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.5rem', color: '#f5f0e6', margin: '0 0 0.5rem' }}>
        No profiles yet
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: '#bdb5a6' }}>
        Be the first to invite someone to Banduraa.
      </p>
    </div>
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

      {profile.back_photo_1_url ? (
        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
          <img src={profile.back_photo_1_url} alt={maskName(profile.full_name)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2rem', color: 'rgba(201,168,76,0.45)' }}>{initials}</span>
        </div>
      )}

      <div className="compact-card-info">
        <p className="compact-card-name" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem', lineHeight: 1.2 }}>
          {maskName(profile.full_name)}
        </p>
        <p className="compact-card-sub" style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.sepia, margin: '0 0 0.4rem' }}>
          {profile.age} · {profile.city}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
          <span className="compact-card-rel" style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, color: c.gold, borderRadius: '20px' }}>
            {profile.religion}
          </span>
          {profile.occupation && (
            <span className="compact-card-occ" style={{ fontFamily: 'Raleway, sans-serif', letterSpacing: '0.04em', color: c.ivoryDim, padding: '0.15rem 0.5rem', background: 'rgba(14,26,53,0.7)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {profile.occupation}
            </span>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.14rem 0.5rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px' }}>
          <span className="compact-card-pid" style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, color: c.gold, letterSpacing: '0.06em' }}>{pid}</span>
        </div>
      </div>
    </div>
  )
}

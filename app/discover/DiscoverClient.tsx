'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import ProfileCard, { type ProfileData } from './ProfileCard'
import { maskName } from '@/lib/maskName'
import { markNotificationRead, acceptMeetingInbox, declineMeetingInbox, toggleShortlist, reportProfile } from './actions'

interface InboxNotification {
  id: string; message: string; type: string; read: boolean; created_at: string; sender_name: string | null
}
interface InboxMeeting {
  id: string; room_id: string; requester_name: string; requester_id: string
  preferred_date: string | null; preferred_time: string | null; message: string | null; created_at: string
}

const c = {
  page: '#07111f', card: '#1e3358', border: 'rgba(201,168,76,0.25)',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', gold: '#c9a84c', navy: '#0d1f3c',
  sepia: '#5a6e82',
}

interface AIMatch { id: string; score: number; reasons: string[]; profile: ProfileData }

function profileId(profile: ProfileData) { return profile.member_id ?? '#' + profile.id.slice(0, 8).toUpperCase() }

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
  inboxNotifications, inboxMeetings, unreadCount, shortlistedIds,
  myMemberId, referralCredits, referralCount,
}: {
  profiles: ProfileData[]; canReveal: boolean; canMeet: boolean; meetingsLeft: number; myProfile: ProfileData | null
  inboxNotifications: InboxNotification[]; inboxMeetings: InboxMeeting[]; unreadCount: number
  shortlistedIds: string[]
  myMemberId: string | null; referralCredits: number; referralCount: number
}) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [shortlist, setShortlist] = useState<Set<string>>(() => new Set(shortlistedIds))
  const [showShortlistOnly, setShowShortlistOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reportTarget, setReportTarget] = useState<ProfileData | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportDone, setReportDone] = useState<string | null>(null)
  const [fGender, setFGender] = useState('')
  const [fLocation, setFLocation] = useState('')
  const [fAgeMin, setFAgeMin] = useState('')
  const [fAgeMax, setFAgeMax] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fEducation, setFEducation] = useState('')
  const [fOccupation, setFOccupation] = useState('')
  const [selected, setSelected] = useState<ProfileData | null>(null)
  const [showInbox, setShowInbox] = useState(false)
  const [showMyProfile, setShowMyProfile] = useState(false)
  const [notifications, setNotifications] = useState(inboxNotifications)
  const [meetings, setMeetings] = useState(inboxMeetings)
  const [liveUnread, setLiveUnread] = useState(unreadCount)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/inbox')
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.notifications)
        setMeetings(data.meetings)
        setLiveUnread(data.unreadCount)
      } catch { /* silent — don't disrupt the page */ }
    }

    pollRef.current = setInterval(poll, 60_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<AIMatch[] | null>(null)
  const [aiError, setAiError] = useState('')

  const activeFilterCount = [fGender, fLocation, fAgeMin, fAgeMax, fReligion, fEducation, fOccupation].filter(Boolean).length

  function clearFilters() {
    setFGender(''); setFLocation(''); setFAgeMin(''); setFAgeMax('')
    setFReligion(''); setFEducation(''); setFOccupation('')
  }

  async function handleShortlist(profileId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setShortlist(prev => {
      const next = new Set(prev)
      if (next.has(profileId)) next.delete(profileId)
      else next.add(profileId)
      return next
    })
    try { await toggleShortlist(profileId) }
    catch { setShortlist(prev => { const next = new Set(prev); if (next.has(profileId)) next.delete(profileId); else next.add(profileId); return next }) }
  }

  async function handleReport() {
    if (!reportTarget || !reportReason) return
    setReportSubmitting(true)
    try {
      const res = await reportProfile(reportTarget.id, reportReason, reportMessage)
      setReportDone(res.alreadyReported ? 'already' : 'sent')
    } catch { setReportDone('error') }
    finally { setReportSubmitting(false) }
  }

  function closeReportModal() {
    setReportTarget(null); setReportReason(''); setReportMessage(''); setReportDone(null); setReportSubmitting(false)
  }

  const religions  = useMemo(() => [...new Set(profiles.map(p => p.religion).filter(Boolean))].sort(), [profiles])
  const educations = useMemo(() => [...new Set(profiles.map(p => p.education).filter(Boolean))].sort(), [profiles])

  const filtered = useMemo(() => {
    let list = profiles
    if (showShortlistOnly) list = list.filter(p => shortlist.has(p.id))
    const q = search.trim().toLowerCase().replace(/^#/, '')
    if (q) list = list.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      (p.member_id ?? '').toLowerCase().includes(q) ||
      p.id.slice(0, 8).toLowerCase().startsWith(q)
    )
    if (fGender) list = list.filter(p => p.gender === fGender)
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
  }, [profiles, shortlist, showShortlistOnly, search, fGender, fLocation, fAgeMin, fAgeMax, fReligion, fEducation, fOccupation])

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

        .disc-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.88);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          overflow-y: auto;
        }
        @media (max-width: 600px) {
          .disc-modal-overlay { align-items: flex-end; padding: 0; }
          .disc-modal-inner { max-height: 92vh !important; border-radius: 16px 16px 0 0 !important; width: 100% !important; }
        }
        @media (max-width: 500px) {
          .find-match-btn { font-size: 0.78rem !important; padding: 0.9rem 1.5rem !important; }
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

        .disc-filter-inp::placeholder { color: #8a9db5 !important; }
        .disc-filter-inp:focus { border-color: #c9a84c !important; }
        @media (max-width: 600px) {
          .disc-search-inp, .disc-filter-inp { font-size: 16px !important; }
          .disc-ai-match-score { margin-left: 0 !important; }
        }

        .find-match-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          width: 100%; max-width: 420px;
          padding: 1.1rem 2rem;
          background: transparent;
          border: 1.5px solid #c9a84c;
          color: #c9a84c;
          font-family: Raleway, sans-serif;
          font-size: 0.88rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 0 32px rgba(201,168,76,0.12);
        }
        .find-match-btn:hover:not(:disabled) {
          background: rgba(201,168,76,0.1);
          box-shadow: 0 0 48px rgba(201,168,76,0.25);
        }
        .find-match-btn:disabled { opacity: 0.55; cursor: default; }

        .disc-h1 { font-size: 2rem; }
        @media (max-width: 600px) { .disc-h1 { font-size: 1.5rem; } }
      `}</style>

      {/* ── 0. Heading row + Inbox ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        <h1 className="disc-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: '#f5f0e6', margin: 0 }}>
          Discover
        </h1>
        <button onClick={() => setShowInbox(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#f5f0e6', fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, cursor: 'pointer', padding: 0, lineHeight: 1 }}
          className="disc-h1">
          Inbox
          {liveUnread > 0 && (
            <span style={{ background: '#c9a84c', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 800, borderRadius: '20px', padding: '0.1rem 0.5rem', minWidth: '18px', textAlign: 'center', verticalAlign: 'middle' }}>
              {liveUnread}
            </span>
          )}
        </button>
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)', marginBottom: '1.5rem' }} />

      {showInbox && (
        <InboxPanel
          notifications={notifications}
          meetings={meetings}
          onDismissNotification={async (id) => {
            await markNotificationRead(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
          }}
          onAcceptMeeting={async (id) => {
            await acceptMeetingInbox(id)
            setMeetings(prev => prev.filter(m => m.id !== id))
          }}
          onDeclineMeeting={async (id) => {
            await declineMeetingInbox(id)
            setMeetings(prev => prev.filter(m => m.id !== id))
          }}
        />
      )}

      {/* ── 1. Search + Filters ── */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: c.sepia, fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or Profile ID…"
              className="disc-search-inp"
              style={{ width: '100%', padding: '0.85rem 0.9rem 0.85rem 2.4rem', background: c.card, border: `1px solid ${c.border}`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = c.gold)}
              onBlur={e => (e.target.style.borderColor = c.border)}
            />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            style={{ padding: '0.85rem 1.1rem', background: showFilters ? 'rgba(201,168,76,0.18)' : c.card, border: `1px solid ${activeFilterCount > 0 ? c.gold : c.border}`, color: activeFilterCount > 0 ? c.gold : c.sepia, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            ⚙ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: '0.6rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>⚧ Gender</label>
                <select value={fGender} onChange={e => setFGender(e.target.value)} className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fGender ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>📍 Location</label>
                <input type="text" value={fLocation} onChange={e => setFLocation(e.target.value)}
                  placeholder="City or country…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)} />
              </div>
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
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🕊 Religion</label>
                <select value={fReligion} onChange={e => setFReligion(e.target.value)} className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fReligion ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any religion</option>
                  {religions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🎓 Education</label>
                <select value={fEducation} onChange={e => setFEducation(e.target.value)} className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fEducation ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any level</option>
                  {educations.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>💼 Occupation</label>
                <input type="text" value={fOccupation} onChange={e => setFOccupation(e.target.value)}
                  placeholder="e.g. Engineer, Doctor…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)} />
              </div>
            </div>
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

      {/* ── 2. FIND MY MATCH button ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button onClick={handleAiMatch} disabled={aiLoading} className="find-match-btn">
          {aiLoading
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✦</span> Analysing your profile…</>
            : <><span style={{ fontSize: '1rem' }}>✦</span> Find My Match</>}
        </button>
      </div>

      {/* ── 3. AI error / results ── */}
      {aiError && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem' }}>
          {aiError}
        </div>
      )}
      {aiMatches && (
        <div style={{ marginBottom: '2rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid rgba(201,168,76,0.12)`, background: 'linear-gradient(to right, rgba(201,168,76,0.08), transparent)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>✨ Your Banduraa Matches</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.sepia, margin: 0 }}>Showing matches with 50+ compatibility · Tap any result to view their full profile</p>
            </div>
            <button onClick={() => { setAiMatches(null); setAiError('') }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#bdb5a6', fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
              ✕ Close
            </button>
          </div>
          {aiMatches.filter(m => m.score >= 50).map((m, i, arr) => (
            <div key={m.id} onClick={() => setSelected(m.profile)}
              style={{ padding: '1.4rem 1.5rem', borderBottom: i < arr.length - 1 ? `1px solid rgba(201,168,76,0.08)` : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: '"Courier New", monospace', fontSize: '1rem', fontWeight: 900, color: c.gold, letterSpacing: '0.08em', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '0.3rem 0.7rem', borderRadius: '6px' }}>{profileId(m.profile)}</span>
                <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, fontSize: '1.35rem' }}>{maskName(m.profile?.full_name ?? '')}</span>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: c.sepia }}>{m.profile?.age} yrs · {m.profile?.city}</span>
                <span className="disc-ai-match-score" style={{ marginLeft: 'auto', fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', color: scoreColor(m.score), background: `${scoreColor(m.score)}18`, border: `1px solid ${scoreColor(m.score)}40`, padding: '0.3rem 0.8rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>{scoreLabel(m.score)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                  <div style={{ height: '100%', width: `${m.score}%`, background: scoreGradient(m.score), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.35rem', fontWeight: 700, color: scoreColor(m.score), minWidth: '64px', textAlign: 'right' }}>{m.score}/100</span>
              </div>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.15rem', color: c.ivoryDim, margin: '0 0 0.8rem', lineHeight: 1.65 }}>
                Profile {profileId(m.profile)} matches your profile with a compatibility score of <strong style={{ color: scoreColor(m.score), fontStyle: 'normal' }}>{m.score} out of 100</strong> — a {scoreLabel(m.score).toLowerCase()}.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {m.reasons.map((r, j) => {
                  const positive = isPositiveReason(r)
                  return (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: positive ? '0.5rem 0.75rem' : '0.35rem 0.5rem', borderRadius: '6px', background: positive ? 'rgba(74,222,128,0.07)' : 'transparent', border: positive ? '1px solid rgba(74,222,128,0.18)' : '1px solid transparent' }}>
                      <span style={{ fontSize: '0.85rem', marginTop: '0.2rem', flexShrink: 0 }}>{positive ? '✅' : '⚠️'}</span>
                      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: positive ? '#e8f5e0' : '#bdb5a6', lineHeight: 1.6, fontWeight: positive ? 600 : 400 }}>{r}</span>
                    </li>
                  )
                })}
              </ul>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: c.gold, textTransform: 'uppercase', margin: '0.9rem 0 0', textAlign: 'right' }}>Tap to view full profile →</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Your profile preview ── */}
      {myProfile && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#1a4731', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '0.35rem 0.9rem', marginBottom: '0.9rem' }}>
            <span style={{ fontSize: '0.7rem' }}>🧑</span>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80' }}>Your Profile — This is how others see you</span>
          </div>
          <div style={{ maxWidth: '260px', cursor: 'pointer' }} onClick={() => setShowMyProfile(true)}>
            <MyProfileCard profile={myProfile} />
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(201,168,76,0.25), transparent)', margin: '1.75rem 0 0' }} />
        </div>
      )}

      {profiles.length === 0 ? (
        <EmptyState />
      ) : (
      <>
        {/* ── 5. Profile count + shortlist toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: c.sepia, letterSpacing: '0.08em', margin: 0 }}>
            {filtered.length} {filtered.length === 1 ? 'profile' : 'profiles'}{(search || activeFilterCount > 0 || showShortlistOnly) ? ' found' : ''}
            {activeFilterCount > 0 && <span style={{ color: c.gold }}> · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
          </p>
          <button onClick={() => setShowShortlistOnly(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: showShortlistOnly ? 'rgba(201,168,76,0.18)' : 'transparent', border: `1px solid ${showShortlistOnly ? c.gold : 'rgba(201,168,76,0.3)'}`, borderRadius: '20px', padding: '0.25rem 0.75rem', color: showShortlistOnly ? c.gold : c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.85rem' }}>{showShortlistOnly ? '♥' : '♡'}</span>
            Shortlisted{shortlist.size > 0 ? ` (${shortlist.size})` : ''}
          </button>
        </div>

        {/* ── 6. Grid ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: c.sepia, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
            {showShortlistOnly ? 'No shortlisted profiles yet. Tap ♡ on any profile to save it.' : 'No profiles match your search.'}
          </div>
        ) : (
          <div className="disc-grid">
            {filtered.map(p => (
              <CompactCard key={p.id} profile={p} onClick={() => setSelected(p)}
                shortlisted={shortlist.has(p.id)}
                onShortlist={(e: React.MouseEvent) => handleShortlist(p.id, e)} />
            ))}
          </div>
        )}

        {/* ── Invite & Earn ── */}
        {myMemberId && (
          <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>Invite &amp; Earn</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: c.sepia, margin: 0, fontStyle: 'italic' }}>
                  Share your link — earn 1 free month of Starter per friend who joins
                </p>
              </div>
              {referralCredits > 0 && (
                <div style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: c.gold, margin: '0 0 0.1rem' }}>FREE MONTHS</p>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', fontWeight: 700, color: c.gold, margin: 0, lineHeight: 1 }}>{referralCredits}</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '6px', padding: '0.55rem 0.75rem', fontFamily: '"Courier New", monospace', fontSize: '0.82rem', color: c.gold, letterSpacing: '0.04em', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                https://banduraa.com/signup?ref={myMemberId}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(`https://banduraa.com/signup?ref=${myMemberId}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ padding: '0.55rem 1.1rem', background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)', border: `1px solid ${copied ? '#4ade80' : c.gold}`, borderRadius: '6px', color: copied ? '#4ade80' : c.gold, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            {referralCount > 0 && (
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.sepia, margin: '0.75rem 0 0', letterSpacing: '0.05em' }}>
                {referralCount} friend{referralCount !== 1 ? 's' : ''} joined via your link
                {referralCredits > 0 ? ' · ' : ''}
                {referralCredits > 0 && <span style={{ color: c.gold }}>Contact support to redeem your {referralCredits} free month{referralCredits !== 1 ? 's' : ''}</span>}
              </p>
            )}
          </div>
        )}
      </>
      )}

      {/* ── 7. Expanded modal ── */}
      {selected && (
        <div className="disc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="disc-modal-inner" style={{ position: 'relative', width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px' }}>
            <div style={{ position: 'sticky', top: '0.75rem', float: 'right', marginRight: '0.75rem', zIndex: 10, display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => { setReportTarget(selected); setSelected(null) }}
                title="Report this profile"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,26,53,0.9)', border: `1px solid ${c.border}`, color: '#e57373', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ⚑
              </button>
              <button onClick={() => setSelected(null)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,26,53,0.9)', border: `1px solid ${c.border}`, color: c.ivoryDim, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
            <ProfileCard profile={selected} canReveal={canReveal} canMeet={canMeet} meetingsLeft={meetingsLeft} />
          </div>
        </div>
      )}

      {/* ── 7b. Report modal ── */}
      {reportTarget && (
        <div className="disc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeReportModal() }}>
          <div className="disc-modal-inner" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '2rem', background: c.card }}>
            {reportDone ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                {reportDone === 'sent' && <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: c.ivory, marginBottom: '0.5rem' }}>Report submitted</p>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', color: c.sepia, fontSize: '0.95rem' }}>Thank you. We will review this profile within 24 hours.</p>
                </>}
                {reportDone === 'already' && <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>ℹ</div>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: c.ivory, marginBottom: '0.5rem' }}>Already reported</p>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', color: c.sepia, fontSize: '0.95rem' }}>You have already submitted a report for this profile.</p>
                </>}
                {reportDone === 'error' && <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✕</div>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#e57373', marginBottom: '0.5rem' }}>Something went wrong</p>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', color: c.sepia, fontSize: '0.95rem' }}>Please try again or contact support.</p>
                </>}
                <button onClick={closeReportModal} style={{ marginTop: '1.25rem', padding: '0.6rem 1.5rem', background: c.gold, color: c.navy, border: 'none', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: '"Playfair Display", serif', color: c.ivory, margin: '0 0 0.35rem', fontSize: '1.3rem' }}>Report Profile</h3>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', color: c.sepia, fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
                  Help us keep Banduraa safe. Your report is confidential and reviewed by our team within 24 hours.
                </p>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: c.gold, marginBottom: '0.4rem' }}>
                  REASON *
                </label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.08)', border: `1px solid ${reportReason ? c.gold : 'rgba(201,168,76,0.3)'}`, color: reportReason ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '6px', outline: 'none', marginBottom: '1rem', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="" disabled>Select a reason</option>
                  <option value="Fake or impersonation">Fake or impersonation</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Harassment or threatening behaviour">Harassment or threatening behaviour</option>
                  <option value="Spam or scam">Spam or scam</option>
                  <option value="Other">Other</option>
                </select>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: c.gold, marginBottom: '0.4rem' }}>
                  ADDITIONAL DETAILS (optional)
                </label>
                <textarea value={reportMessage} onChange={e => setReportMessage(e.target.value)} rows={3} placeholder="Provide any extra context that might help our review..."
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.3)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '6px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1.5rem' }} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={closeReportModal} style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: `1px solid ${c.border}`, color: c.sepia, borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleReport} disabled={!reportReason || reportSubmitting}
                    style={{ padding: '0.6rem 1.5rem', background: reportReason && !reportSubmitting ? '#c0392b' : 'rgba(192,57,43,0.4)', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', cursor: reportReason && !reportSubmitting ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                    {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 8. Own profile preview modal ── */}
      {showMyProfile && myProfile && (
        <div className="disc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowMyProfile(false) }}>
          <div className="disc-modal-inner" style={{ position: 'relative', width: '100%', maxWidth: '820px', maxHeight: '92vh', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Banner */}
            <div style={{ background: '#1a3a2a', borderBottom: '1px solid rgba(74,222,128,0.2)', padding: '0.7rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#4ade80', margin: 0 }}>
                🧑 This is your profile — exactly as other members see it
              </p>
              <button onClick={() => setShowMyProfile(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#bdb5a6', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ✕
              </button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(92vh - 48px)' }}>
              <ProfileCard profile={myProfile} previewMode canReveal={false} canMeet={false} meetingsLeft={0} />
            </div>
          </div>
        </div>
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

function MyProfileCard({ profile }: { profile: ProfileData }) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const pid = profile.member_id ?? '#' + profile.id.slice(0, 8).toUpperCase()
  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Photo with YOU badge */}
      <div style={{ position: 'relative' }}>
        {profile.back_photo_1_url ? (
          <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
            <img src={profile.back_photo_1_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
          </div>
        ) : (
          <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2.5rem', color: 'rgba(201,168,76,0.35)' }}>{initials}</span>
          </div>
        )}
        <span style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: '#16a34a', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>YOU</span>
      </div>
      {/* Info */}
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
        </div>
        {profile.occupation && (
          <p className="compact-card-occ" style={{ fontFamily: 'Raleway, sans-serif', letterSpacing: '0.04em', color: c.ivoryDim, margin: '0 0 0.4rem' }}>
            {profile.occupation}
          </p>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.14rem 0.5rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px' }}>
          <span className="compact-card-pid" style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, color: c.gold, letterSpacing: '0.06em' }}>{pid}</span>
        </div>
      </div>
    </div>
  )
}

function typeIcon(type: string) {
  if (type === 'photo_revealed') return '📸'
  if (type === 'meeting_request') return '📅'
  if (type === 'meeting_accepted') return '✅'
  if (type === 'meeting_declined') return '❌'
  return '🔔'
}

function InboxPanel({ notifications, meetings, onDismissNotification, onAcceptMeeting, onDeclineMeeting }: {
  notifications: InboxNotification[]
  meetings: InboxMeeting[]
  onDismissNotification: (id: string) => Promise<void>
  onAcceptMeeting: (id: string) => Promise<void>
  onDeclineMeeting: (id: string) => Promise<void>
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleAction(id: string, fn: (id: string) => Promise<void>) {
    setLoadingId(id)
    try { await fn(id) } finally { setLoadingId(null) }
  }

  const isEmpty = notifications.length === 0 && meetings.length === 0

  return (
    <div style={{ marginBottom: '1.5rem', background: '#1a2d4e', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'linear-gradient(to right, rgba(201,168,76,0.08), transparent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a84c' }}>✦ Inbox</span>
      </div>

      {isEmpty ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#5a6e82', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem' }}>
          No messages yet. When someone reveals your photo or requests a meeting, it will appear here.
        </div>
      ) : (
        <div>
          {meetings.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c9a84c', margin: 0, padding: '0.75rem 1.25rem 0.5rem', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
                📅 Meeting Requests
              </p>
              {meetings.map(m => (
                <div key={m.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.6rem' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1rem', fontWeight: 600, color: '#f5f0e6', margin: '0 0 0.2rem' }}>
                        {maskName(m.requester_name)} wants to meet you
                      </p>
                      {(m.preferred_date || m.preferred_time) && (
                        <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.9rem', color: '#bdb5a6', margin: '0 0 0.3rem' }}>
                          📆 {m.preferred_date}{m.preferred_time ? ` at ${m.preferred_time}` : ''}
                        </p>
                      )}
                      {m.message && (
                        <p style={{ fontFamily: '"Cormorant Garamond",serif', fontStyle: 'italic', fontSize: '0.9rem', color: '#bdb5a6', margin: 0 }}>
                          &ldquo;{m.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.75rem', color: '#5a6e82', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={() => handleAction(m.id, onAcceptMeeting)} disabled={loadingId === m.id}
                      style={{ flex: 1, padding: '0.55rem', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontFamily: 'Raleway,sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: loadingId === m.id ? 'default' : 'pointer', opacity: loadingId === m.id ? 0.6 : 1 }}>
                      ✓ Accept
                    </button>
                    <button onClick={() => handleAction(m.id, onDeclineMeeting)} disabled={loadingId === m.id}
                      style={{ flex: 1, padding: '0.55rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: 'Raleway,sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: loadingId === m.id ? 'default' : 'pointer', opacity: loadingId === m.id ? 0.6 : 1 }}>
                      ✕ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c9a84c', margin: 0, padding: '0.75rem 1.25rem 0.5rem', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
                🔔 Notifications
              </p>
              {notifications.map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: n.read ? 'transparent' : 'rgba(201,168,76,0.03)' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.95rem', color: '#f5f0e6', margin: '0 0 0.25rem', lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ fontFamily: 'Raleway,sans-serif', fontSize: '0.62rem', color: '#5a6e82', margin: 0 }}>
                      {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <button onClick={() => handleAction(n.id, onDismissNotification)} disabled={loadingId === n.id}
                      style={{ flexShrink: 0, background: 'none', border: 'none', color: '#5a6e82', fontSize: '1.2rem', cursor: 'pointer', padding: '0', lineHeight: 1, opacity: loadingId === n.id ? 0.4 : 1 }}
                      title="Mark as read">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompactCard({ profile, onClick, shortlisted = false, onShortlist }: {
  profile: ProfileData; onClick: () => void
  shortlisted?: boolean; onShortlist?: (e: React.MouseEvent) => void
}) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const pid = profile.member_id ?? '#' + profile.id.slice(0, 8).toUpperCase()
  return (
    <div onClick={onClick}
      style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Photo area — single square crop */}
      <div style={{ position: 'relative' }}>
        {profile.back_photo_1_url ? (
          <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
            <img src={profile.back_photo_1_url} alt={maskName(profile.full_name)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
          </div>
        ) : (
          <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2rem', color: 'rgba(201,168,76,0.45)' }}>{initials}</span>
          </div>
        )}
        {onShortlist && (
          <button onClick={onShortlist}
            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem', color: shortlisted ? '#c9a84c' : 'rgba(255,255,255,0.7)', transition: 'all 0.15s', lineHeight: 1 }}
            title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}>
            {shortlisted ? '♥' : '♡'}
          </button>
        )}
      </div>

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

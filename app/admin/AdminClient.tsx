'use client'

import React, { useState } from 'react'
import { verifyMember, rejectMemberId, updateMemberCRM, markMemberContacted, updateTicket } from './actions'

const c = {
  navy: '#0d1f3c', navy2: '#122d52', navy3: '#1a3a6b',
  gold: '#c9a84c', gold2: '#e8c96b',
  text: '#e8e3d8', text2: 'rgba(232,227,216,0.65)', text3: 'rgba(232,227,216,0.35)',
  border: 'rgba(201,168,76,0.2)', border2: 'rgba(201,168,76,0.08)',
  card: 'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.07)',
  green: '#2e7d52', amber: '#c97a2e', rose: '#9e2a2b',
}

type Tab = 'dashboard' | 'members' | 'meetings' | 'reveals' | 'subscriptions' | 'id_verification' | 'crm' | 'tickets'

interface IdVerification {
  id: string
  full_name: string
  id_country: string
  doc_url: string | null
  created_at: string
}

interface Props {
  stats: { totalMembers: number; newThisWeek: number; activeSubscribers: number; revealsToday: number; pendingMeetings: number }
  members: Record<string, unknown>[]
  meetings: Record<string, unknown>[]
  reveals: Record<string, unknown>[]
  planCounts: Record<string, number>
  idVerifications: IdVerification[]
  tickets: Record<string, unknown>[]
  defaultTab?: Tab
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard',       icon: '◼',  label: 'Dashboard' },
  { id: 'members',         icon: '👤', label: 'Members' },
  { id: 'meetings',        icon: '🎥', label: 'Meetings' },
  { id: 'reveals',         icon: '💘', label: 'Reveals' },
  { id: 'subscriptions',   icon: '💳', label: 'Subscriptions' },
  { id: 'id_verification', icon: '🪪', label: 'ID Verify' },
  { id: 'crm',             icon: '📋', label: 'CRM' },
  { id: 'tickets',         icon: '🎫', label: 'Tickets' },
]

const TICKET_STATUSES = [
  { value: 'open',        label: 'Open',        color: '#fbbf24', bg: 'rgba(201,122,46,0.2)' },
  { value: 'in_progress', label: 'In Progress', color: '#60a5fa', bg: 'rgba(37,99,235,0.2)'  },
  { value: 'resolved',    label: 'Resolved',    color: '#4ade80', bg: 'rgba(46,125,82,0.2)'  },
]

const CRM_STATUSES = [
  { value: 'active',    label: 'Active',    color: '#4ade80', bg: 'rgba(46,125,82,0.2)' },
  { value: 'follow_up', label: 'Follow Up', color: '#fbbf24', bg: 'rgba(201,122,46,0.2)' },
  { value: 'vip',       label: 'VIP',       color: '#c9a84c', bg: 'rgba(201,168,76,0.2)' },
  { value: 'inactive',  label: 'Inactive',  color: '#9aabb8', bg: 'rgba(154,171,184,0.15)' },
  { value: 'churned',   label: 'Churned',   color: '#f87171', bg: 'rgba(158,42,43,0.2)' },
]

function fmt(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function planBadge(plan: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    free:     { bg: 'rgba(232,227,216,0.08)', color: c.text3 },
    starter:  { bg: 'rgba(201,168,76,0.15)',  color: c.gold  },
    standard: { bg: 'rgba(46,125,82,0.2)',    color: '#4ade80' },
  }
  const s = styles[plan] ?? styles.free
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {plan ?? 'free'}
    </span>
  )
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: 'rgba(201,122,46,0.2)',  color: '#fbbf24' },
    accepted: { bg: 'rgba(46,125,82,0.2)',   color: '#4ade80' },
    declined: { bg: 'rgba(158,42,43,0.2)',   color: '#f87171' },
  }
  const s = map[status] ?? map.pending
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number; sub?: string }) {
  return (
    <div style={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em',
        textTransform: 'uppercase', color: c.text3, marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', fontWeight: 700,
        color: c.gold, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: c.text3, marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  )
}

const th: React.CSSProperties = {
  fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: c.text3,
  padding: '0.75rem 1rem', textAlign: 'left', borderBottom: `1px solid ${c.border2}`,
  whiteSpace: 'nowrap',
}
const td: React.CSSProperties = {
  padding: '0.75rem 1rem', fontSize: '0.82rem', color: c.text2,
  borderBottom: `1px solid ${c.border2}`, whiteSpace: 'nowrap',
}

export default function AdminClient({ stats, members, meetings, reveals, planCounts, idVerifications, tickets, defaultTab }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab ?? 'dashboard')
  const [idDocs, setIdDocs] = useState<IdVerification[]>(idVerifications)
  const [idAction, setIdAction] = useState<Record<string, 'verifying' | 'rejecting' | 'done'>>({})

  const [crmFilter, setCrmFilter] = useState('all')
  const [crmData, setCrmData] = useState<Record<string, { status: string; notes: string; last_contacted: string | null }>>(() => {
    const init: Record<string, { status: string; notes: string; last_contacted: string | null }> = {}
    for (const m of members as any[]) {
      if (m.onboarding_complete) {
        init[m.id] = { status: m.crm_status ?? 'active', notes: m.crm_notes ?? '', last_contacted: m.crm_last_contacted ?? null }
      }
    }
    return init
  })
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingCrm, setSavingCrm] = useState<Record<string, boolean>>({})

  async function handleStatusChange(profileId: string, status: string) {
    setCrmData(prev => ({ ...prev, [profileId]: { ...prev[profileId], status } }))
    await updateMemberCRM(profileId, { crm_status: status })
  }

  function startEditNote(profileId: string, current: string) {
    setEditingNote(profileId)
    setNoteText(current)
  }

  async function handleSaveNote(profileId: string) {
    setSavingCrm(prev => ({ ...prev, [profileId]: true }))
    try {
      await updateMemberCRM(profileId, { crm_notes: noteText })
      setCrmData(prev => ({ ...prev, [profileId]: { ...prev[profileId], notes: noteText } }))
      setEditingNote(null)
    } finally {
      setSavingCrm(prev => { const n = { ...prev }; delete n[profileId]; return n })
    }
  }

  async function handleMarkContacted(profileId: string) {
    const now = new Date().toISOString()
    await markMemberContacted(profileId)
    setCrmData(prev => ({ ...prev, [profileId]: { ...prev[profileId], last_contacted: now } }))
  }

  const [ticketFilter, setTicketFilter] = useState('open')
  const [ticketData, setTicketData] = useState<Record<string, { status: string; admin_notes: string }>>(() => {
    const init: Record<string, { status: string; admin_notes: string }> = {}
    for (const t of tickets as any[]) {
      init[t.id] = { status: t.status ?? 'open', admin_notes: t.admin_notes ?? '' }
    }
    return init
  })
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [ticketNoteText, setTicketNoteText] = useState('')
  const [savingTicket, setSavingTicket] = useState<Record<string, boolean>>({})

  async function handleUpdateTicket(ticketId: string, updates: { status?: string; admin_notes?: string }) {
    setSavingTicket(prev => ({ ...prev, [ticketId]: true }))
    try {
      await updateTicket(ticketId, updates)
      setTicketData(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], ...updates } }))
      if (updates.admin_notes !== undefined) setExpandedTicket(null)
    } finally {
      setSavingTicket(prev => { const n = { ...prev }; delete n[ticketId]; return n })
    }
  }

  async function handleVerify(profileId: string) {
    setIdAction(p => ({ ...p, [profileId]: 'verifying' }))
    try {
      await verifyMember(profileId)
      setIdDocs(d => d.filter(x => x.id !== profileId))
    } finally {
      setIdAction(p => { const n = { ...p }; delete n[profileId]; return n })
    }
  }

  async function handleReject(profileId: string) {
    setIdAction(p => ({ ...p, [profileId]: 'rejecting' }))
    try {
      await rejectMemberId(profileId)
      setIdDocs(d => d.filter(x => x.id !== profileId))
    } finally {
      setIdAction(p => { const n = { ...p }; delete n[profileId]; return n })
    }
  }

  const sectionTitle = (title: string, count?: number) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: c.text, margin: 0 }}>{title}</h2>
        {count !== undefined && (
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.text3,
            letterSpacing: '0.15em', textTransform: 'uppercase' }}>{count} records</span>
        )}
      </div>
      <div style={{ height: 1, background: `linear-gradient(to right, ${c.gold}, transparent)`, marginTop: '0.5rem' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.navy, color: c.text }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 2px; }
        .admin-row:hover td { background: ${c.card2}; }
        @media (max-width: 768px) {
          .admin-sidebar { width: 56px !important; }
          .admin-sidebar .nav-label { display: none; }
          .admin-sidebar .brand-text { display: none; }
          .admin-main { margin-left: 56px !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: 220, minHeight: '100vh', background: 'rgba(0,0,0,0.3)',
        borderRight: `1px solid ${c.border}`, position: 'fixed', top: 0, left: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: `1px solid ${c.border}` }}>
          <span className="brand-text" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
            fontSize: '1.25rem', color: c.gold, display: 'block' }}>Banduraa</span>
          <span className="brand-text" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem',
            letterSpacing: '0.3em', textTransform: 'uppercase', color: c.text3 }}>Admin Panel</span>
        </div>
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.7rem 1.25rem', border: 'none', cursor: 'pointer',
                borderLeft: `2px solid ${tab === t.id ? c.gold : 'transparent'}`,
                background: tab === t.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                color: tab === t.id ? c.gold : c.text2,
                fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', fontWeight: 500,
                transition: 'all 0.15s', textAlign: 'left' }}>
              <span style={{ fontSize: '1rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
              <span className="nav-label" style={{ flex: 1 }}>{t.label}</span>
              {t.id === 'id_verification' && idDocs.length > 0 && (
                <span className="nav-label" style={{ minWidth: 20, height: 20, borderRadius: '50%', background: '#f59e0b', color: '#0d1f3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                  {idDocs.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${c.border}` }}>
          <a href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem',
            color: c.text3, textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to app</a>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main" style={{ marginLeft: 220, flex: 1, padding: '2rem 2.5rem', minWidth: 0 }}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            {sectionTitle('Dashboard')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <StatCard icon="👤" label="Total Members"      value={stats.totalMembers}      sub="completed onboarding" />
              <StatCard icon="✨" label="New This Week"       value={stats.newThisWeek}       sub="joined last 7 days" />
              <StatCard icon="💳" label="Paid Subscribers"    value={stats.activeSubscribers} sub="starter + standard" />
              <StatCard icon="💘" label="Reveals Today"       value={stats.revealsToday}      sub="face photos seen" />
              <StatCard icon="⏳" label="Pending Meetings"    value={stats.pendingMeetings}   sub="awaiting response" />
              <StatCard icon="🪪" label="ID Pending"          value={idDocs.length}           sub="awaiting verification" />
            </div>

            {/* Recent members */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text,
                margin: '0 0 1rem' }}>Recent Members</h3>
              <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Member ID','Name','Age','Location','Plan','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.onboarding_complete).slice(0, 10).map((m: any) => (
                      <tr key={m.id} className="admin-row">
                        <td style={{ ...td, fontFamily: 'monospace', color: c.gold, fontSize: '0.78rem' }}>{m.member_id ?? '—'}</td>
                        <td style={td}>{m.full_name ?? '—'}</td>
                        <td style={td}>{m.age ?? '—'}</td>
                        <td style={td}>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</td>
                        <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                        <td style={td}>{fmt(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div>
            {sectionTitle('Members', members.filter((m: any) => m.onboarding_complete).length)}
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Member ID','Name','Age','Gender','Location','Religion','Plan','WhatsApp','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.filter((m: any) => m.onboarding_complete).map((m: any) => (
                    <tr key={m.id} className="admin-row">
                      <td style={{ ...td, fontFamily: 'monospace', color: c.gold, fontSize: '0.78rem' }}>{m.member_id ?? '—'}</td>
                      <td style={{ ...td, color: c.text, fontWeight: 500 }}>{m.full_name ?? '—'}</td>
                      <td style={td}>{m.age ?? '—'}</td>
                      <td style={td}>{m.gender ?? '—'}</td>
                      <td style={td}>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</td>
                      <td style={td}>{m.religion ?? '—'}</td>
                      <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                      <td style={td}>
                        <span style={{ color: m.phone ? '#4ade80' : c.text3, fontSize: '0.75rem' }}>
                          {m.phone ? '✓ ' + m.phone : '—'}
                        </span>
                      </td>
                      <td style={td}>{fmt(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEETINGS ── */}
        {tab === 'meetings' && (
          <div>
            {sectionTitle('Video Meetings', meetings.length)}
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Requester','Recipient','Status','Date','Time','Requested'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {meetings.map((m: any) => (
                    <tr key={m.id} className="admin-row">
                      <td style={{ ...td, color: c.text }}>{m.requester_name}</td>
                      <td style={{ ...td, color: c.text }}>{m.recipient_name}</td>
                      <td style={td}>{statusBadge(m.status)}</td>
                      <td style={td}>{m.preferred_date ? fmt(m.preferred_date) : '—'}</td>
                      <td style={td}>{m.preferred_time ?? '—'}</td>
                      <td style={td}>{fmt(m.created_at)}</td>
                    </tr>
                  ))}
                  {meetings.length === 0 && (
                    <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: c.text3, padding: '2rem' }}>No meetings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REVEALS ── */}
        {tab === 'reveals' && (
          <div>
            {sectionTitle('Photo Reveals', reveals.length)}
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Viewer','Profile Revealed','Date & Time'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {reveals.map((r: any) => (
                    <tr key={r.id} className="admin-row">
                      <td style={{ ...td, color: c.text }}>{r.viewer_name}</td>
                      <td style={{ ...td, color: c.text }}>{r.viewed_name}</td>
                      <td style={td}>
                        {new Date(r.revealed_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                  {reveals.length === 0 && (
                    <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: c.text3, padding: '2rem' }}>No reveals yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ID VERIFICATION ── */}
        {tab === 'id_verification' && (
          <div>
            {sectionTitle('ID Verification', idDocs.length)}
            {idDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: c.text, margin: '0 0 0.4rem' }}>All clear</p>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text3 }}>No pending ID verifications at this time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {idDocs.map(doc => (
                  <div key={doc.id} style={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${c.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 0.25rem' }}>{doc.full_name}</p>
                        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.text3, margin: 0, letterSpacing: '0.08em' }}>
                          ID Country: <strong style={{ color: c.text2 }}>{doc.id_country}</strong> · Submitted: {fmt(doc.created_at)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleVerify(doc.id)} disabled={!!idAction[doc.id]}
                          style={{ padding: '0.5rem 1.25rem', background: 'rgba(46,125,82,0.2)', border: '1px solid rgba(46,125,82,0.5)', color: '#4ade80', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, cursor: idAction[doc.id] ? 'default' : 'pointer', opacity: idAction[doc.id] ? 0.6 : 1 }}>
                          {idAction[doc.id] === 'verifying' ? 'Verifying…' : '✅ Verify'}
                        </button>
                        <button onClick={() => handleReject(doc.id)} disabled={!!idAction[doc.id]}
                          style={{ padding: '0.5rem 1.25rem', background: 'rgba(158,42,43,0.2)', border: '1px solid rgba(158,42,43,0.5)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, cursor: idAction[doc.id] ? 'default' : 'pointer', opacity: idAction[doc.id] ? 0.6 : 1 }}>
                          {idAction[doc.id] === 'rejecting' ? 'Rejecting…' : '✗ Reject'}
                        </button>
                      </div>
                    </div>
                    {doc.doc_url ? (
                      <div style={{ padding: '1rem 1.5rem' }}>
                        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.text3, margin: '0 0 0.6rem' }}>ID Document</p>
                        <a href={doc.doc_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                          <img src={doc.doc_url} alt="ID document" style={{ maxWidth: '480px', width: '100%', borderRadius: 4, border: `1px solid ${c.border2}`, display: 'block' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </a>
                        <a href={doc.doc_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: '0.5rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'underline' }}>
                          Open in new tab ↗
                        </a>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 1.5rem' }}>
                        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.text3 }}>Document URL expired or unavailable. Reload the page to refresh.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUBSCRIPTIONS ── */}
        {tab === 'subscriptions' && (
          <div>
            {sectionTitle('Subscriptions')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {[
                { plan: 'free',     label: 'Free',     icon: '🔓', color: c.text3 },
                { plan: 'starter',  label: 'Starter',  icon: '⭐', color: c.gold  },
                { plan: 'standard', label: 'Standard', icon: '💎', color: '#4ade80' },
              ].map(({ plan, label, icon, color }) => (
                <div key={plan} style={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, padding: '1.5rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                  <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: c.text3, marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem',
                    fontWeight: 700, color, lineHeight: 1 }}>{planCounts[plan] ?? 0}</div>
                  <div style={{ fontSize: '0.72rem', color: c.text3, marginTop: '0.3rem' }}>members</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 1rem' }}>
              Member Plan Breakdown
            </h3>
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Name','Location','Plan','WhatsApp','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.filter((m: any) => m.onboarding_complete).sort((a: any, b: any) => {
                    const order = { standard: 0, starter: 1, free: 2 }
                    return (order[a.plan as keyof typeof order] ?? 2) - (order[b.plan as keyof typeof order] ?? 2)
                  }).map((m: any) => (
                    <tr key={m.id} className="admin-row">
                      <td style={{ ...td, color: c.text, fontWeight: 500 }}>{m.full_name ?? '—'}</td>
                      <td style={td}>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</td>
                      <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                      <td style={td}>
                        <span style={{ color: m.phone ? '#4ade80' : c.text3, fontSize: '0.75rem' }}>
                          {m.phone ? '✓' : '—'}
                        </span>
                      </td>
                      <td style={td}>{fmt(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ── TICKETS ── */}
        {tab === 'tickets' && (
          <div>
            {sectionTitle('Support Tickets', (tickets as any[]).length)}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[{ value: 'all', label: 'All' }, ...TICKET_STATUSES].map(s => {
                const count = s.value === 'all'
                  ? (tickets as any[]).length
                  : (tickets as any[]).filter(t => (ticketData[t.id]?.status ?? 'open') === s.value).length
                return (
                  <button key={s.value} onClick={() => setTicketFilter(s.value)}
                    style={{ padding: '0.35rem 0.85rem', border: `1px solid ${ticketFilter === s.value ? c.gold : c.border}`, borderRadius: 20, background: ticketFilter === s.value ? 'rgba(201,168,76,0.12)' : 'transparent', color: ticketFilter === s.value ? c.gold : c.text2, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {s.label}
                    <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0 0.35rem', fontSize: '0.65rem' }}>{count}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(tickets as any[])
                .filter(t => ticketFilter === 'all' || (ticketData[t.id]?.status ?? 'open') === ticketFilter)
                .map(t => {
                  const tdata = ticketData[t.id] ?? { status: 'open', admin_notes: '' }
                  const statusInfo = TICKET_STATUSES.find(s => s.value === tdata.status) ?? TICKET_STATUSES[0]
                  const isExpanded = expandedTicket === t.id
                  return (
                    <div key={t.id} style={{ background: c.card2, border: `1px solid ${isExpanded ? c.border : c.border2}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', cursor: 'pointer' }}
                        onClick={() => { setExpandedTicket(isExpanded ? null : t.id); setTicketNoteText(tdata.admin_notes) }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', color: c.text, fontWeight: 500 }}>{t.subject}</span>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.text3, flexWrap: 'wrap' }}>
                            <span>👤 {t.name}</span>
                            <span>📧 {t.email}</span>
                            <span>🕐 {fmt(t.created_at)}</span>
                          </div>
                        </div>
                        <span style={{ color: c.text3, fontSize: '0.8rem', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${c.border2}`, padding: '1.25rem 1.5rem' }}>
                          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.text3, margin: '0 0 0.5rem' }}>Message</p>
                          <div style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${c.border2}`, borderRadius: 6, padding: '1rem', marginBottom: '1.25rem' }}>
                            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: c.text2, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{t.message}</p>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div>
                              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.text3, margin: '0 0 0.4rem' }}>Status</p>
                              <select value={tdata.status} onChange={e => handleUpdateTicket(t.id, { status: e.target.value })}
                                style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}44`, borderRadius: 4, padding: '0.35rem 0.75rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                {TICKET_STATUSES.map(s => <option key={s.value} value={s.value} style={{ background: '#0d1f3c', color: '#e8e3d8' }}>{s.label}</option>)}
                              </select>
                            </div>
                            <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)} — Banduraa Support`}
                              style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textDecoration: 'none', borderRadius: 4 }}>
                              ✉ Reply via Email
                            </a>
                          </div>

                          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.text3, margin: '0 0 0.4rem' }}>Internal Notes</p>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <textarea value={ticketNoteText} onChange={e => setTicketNoteText(e.target.value)}
                              placeholder="Add internal notes about this ticket…" rows={2}
                              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`, borderRadius: 4, padding: '0.5rem 0.75rem', color: c.text, fontFamily: 'Georgia, serif', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical' as const, outline: 'none' }} />
                            <button onClick={() => handleUpdateTicket(t.id, { admin_notes: ticketNoteText })} disabled={savingTicket[t.id]}
                              style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', border: 'none', borderRadius: 4, cursor: savingTicket[t.id] ? 'default' : 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, opacity: savingTicket[t.id] ? 0.6 : 1, whiteSpace: 'nowrap' as const }}>
                              {savingTicket[t.id] ? 'Saving…' : 'Save Note'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

              {(tickets as any[]).filter(t => ticketFilter === 'all' || (ticketData[t.id]?.status ?? 'open') === ticketFilter).length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: c.text, margin: '0 0 0.4rem' }}>All clear</p>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text3 }}>No {ticketFilter === 'all' ? '' : ticketFilter.replace('_', ' ') + ' '}tickets at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CRM ── */}
        {tab === 'crm' && (
          <div>
            {sectionTitle('CRM', members.filter((m: any) => m.onboarding_complete).length)}

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[{ value: 'all', label: 'All' }, ...CRM_STATUSES].map(s => {
                const count = s.value === 'all'
                  ? members.filter((m: any) => m.onboarding_complete).length
                  : members.filter((m: any) => m.onboarding_complete && (crmData[m.id]?.status ?? 'active') === s.value).length
                return (
                  <button key={s.value} onClick={() => setCrmFilter(s.value)}
                    style={{ padding: '0.35rem 0.85rem', border: `1px solid ${crmFilter === s.value ? c.gold : c.border}`, borderRadius: 20, background: crmFilter === s.value ? 'rgba(201,168,76,0.12)' : 'transparent', color: crmFilter === s.value ? c.gold : c.text2, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {s.label}
                    <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0 0.35rem', fontSize: '0.65rem' }}>{count}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Member ID', 'Name', 'Plan', 'Status', 'Last Contacted', 'Notes', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members
                    .filter((m: any) => m.onboarding_complete)
                    .filter((m: any) => crmFilter === 'all' || (crmData[m.id]?.status ?? 'active') === crmFilter)
                    .map((m: any) => {
                      const crm = crmData[m.id] ?? { status: 'active', notes: '', last_contacted: null }
                      const statusInfo = CRM_STATUSES.find(s => s.value === crm.status) ?? CRM_STATUSES[0]
                      const isEditing = editingNote === m.id
                      return (
                        <React.Fragment key={m.id}>
                          <tr className="admin-row">
                            <td style={{ ...td, fontFamily: 'monospace', color: c.gold, fontSize: '0.78rem' }}>{m.member_id ?? '—'}</td>
                            <td style={{ ...td, color: c.text, fontWeight: 500 }}>{m.full_name ?? '—'}</td>
                            <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                            <td style={td}>
                              <select value={crm.status} onChange={e => handleStatusChange(m.id, e.target.value)}
                                style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}44`, borderRadius: 4, padding: '0.25rem 0.5rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                {CRM_STATUSES.map(s => <option key={s.value} value={s.value} style={{ background: '#0d1f3c', color: '#e8e3d8' }}>{s.label}</option>)}
                              </select>
                            </td>
                            <td style={td}>{crm.last_contacted ? fmt(crm.last_contacted) : <span style={{ color: c.text3 }}>Never</span>}</td>
                            <td style={{ ...td, maxWidth: 220 }}>
                              {isEditing ? (
                                <span style={{ color: c.gold, fontSize: '0.72rem' }}>editing…</span>
                              ) : crm.notes ? (
                                <span style={{ fontSize: '0.78rem', color: c.text2 }} title={crm.notes}>
                                  {crm.notes.length > 45 ? crm.notes.slice(0, 45) + '…' : crm.notes}
                                </span>
                              ) : (
                                <span style={{ color: c.text3, fontSize: '0.72rem' }}>—</span>
                              )}
                            </td>
                            <td style={td}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => handleMarkContacted(m.id)}
                                  style={{ padding: '0.3rem 0.6rem', background: 'rgba(46,125,82,0.15)', border: '1px solid rgba(46,125,82,0.4)', color: '#4ade80', borderRadius: 4, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  ✓ Contacted
                                </button>
                                <button onClick={() => isEditing ? setEditingNote(null) : startEditNote(m.id, crm.notes)}
                                  style={{ padding: '0.3rem 0.6rem', background: 'rgba(201,168,76,0.12)', border: `1px solid ${c.border}`, color: c.gold, borderRadius: 4, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700 }}>
                                  {isEditing ? '✕' : '📝'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isEditing && (
                            <tr>
                              <td colSpan={7} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${c.border2}` }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                                    placeholder="Add a note about this member…" rows={3}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`, borderRadius: 4, padding: '0.5rem 0.75rem', color: c.text, fontFamily: 'Georgia, serif', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
                                  <button onClick={() => handleSaveNote(m.id)} disabled={savingCrm[m.id]}
                                    style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', border: 'none', borderRadius: 4, cursor: savingCrm[m.id] ? 'default' : 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', opacity: savingCrm[m.id] ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                                    {savingCrm[m.id] ? 'Saving…' : 'Save Note'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

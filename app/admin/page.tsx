import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = 'london.anup@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== ADMIN_EMAIL) redirect('/discover')

  const admin = createAdminClient()

  const [membersRes, meetingsRes, revealsRes, ticketsRes, reportsRes, paymentsRes] = await Promise.all([
    admin.from('profiles')
      .select('id, full_name, age, gender, city, country, plan, phone, onboarding_complete, created_at, id_verified, id_document_path, id_country, member_id, crm_status, crm_notes, crm_last_contacted, suspended')
      .order('created_at', { ascending: false }),
    admin.from('video_meetings')
      .select('id, room_id, requester_id, recipient_id, status, preferred_date, preferred_time, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('photo_reveals')
      .select('id, viewer_id, viewed_id, revealed_at')
      .order('revealed_at', { ascending: false })
      .limit(200),
    admin.from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('reports')
      .select('id, reporter_id, reported_id, reason, message, created_at, status')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('pixxles_payments')
      .select('id, user_id, plan, amount, currency, status, transaction_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const members   = membersRes.data   ?? []
  const meetings  = meetingsRes.data  ?? []
  const reveals   = revealsRes.data   ?? []
  const tickets   = ticketsRes.data   ?? []
  const reports   = reportsRes.data   ?? []
  const payments  = paymentsRes.data  ?? []

  // Build name + member_id lookup from members
  const nameById: Record<string, string> = {}
  const memberIdById: Record<string, string> = {}
  for (const m of members) {
    if (m.id && m.full_name) nameById[m.id] = m.full_name
    if (m.id && (m as Record<string, unknown>).member_id) memberIdById[m.id] = (m as Record<string, unknown>).member_id as string
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const stats = {
    totalMembers:       members.filter(m => m.onboarding_complete).length,
    newThisWeek:        members.filter(m => new Date(m.created_at) > weekAgo && m.onboarding_complete).length,
    activeSubscribers:  members.filter(m => m.plan && m.plan !== 'free').length,
    revealsToday:       reveals.filter(r => new Date(r.revealed_at) >= today).length,
    revealsThisMonth:   reveals.filter(r => new Date(r.revealed_at) >= monthStart).length,
    pendingMeetings:    meetings.filter(m => m.status === 'pending').length,
    meetingsAccepted:   meetings.filter(m => m.status === 'accepted').length,
    reportsPending:     reports.filter(r => (r.status ?? 'pending') === 'pending').length,
  }

  const planCounts = members.filter(m => m.onboarding_complete).reduce((acc, m) => {
    const plan = m.plan ?? 'free'
    acc[plan] = (acc[plan] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const meetingsWithNames = meetings.map(m => ({
    ...m,
    requester_name: nameById[m.requester_id] ?? m.requester_id.slice(0, 8),
    recipient_name: nameById[m.recipient_id] ?? m.recipient_id.slice(0, 8),
  }))

  const revealsWithNames = reveals.map(r => ({
    ...r,
    viewer_name: nameById[r.viewer_id] ?? r.viewer_id.slice(0, 8),
    viewed_name: nameById[r.viewed_id] ?? r.viewed_id.slice(0, 8),
  }))

  // Build ID verification list — members who submitted a doc but aren't yet verified
  const pendingIdMembers = members.filter(m => m.id_document_path && !m.id_verified)
  const idDocPaths = pendingIdMembers.map(m => m.id_document_path).filter((p): p is string => !!p)
  const idUrlMap: Record<string, string> = {}
  if (idDocPaths.length > 0) {
    const { data: signed } = await admin.storage.from('profile-media').createSignedUrls(idDocPaths, 3600)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) idUrlMap[s.path] = s.signedUrl
    }
  }
  const idVerifications = pendingIdMembers.map(m => ({
    id: m.id,
    full_name: m.full_name ?? '—',
    id_country: (m as Record<string, unknown>).id_country as string ?? '—',
    doc_url: m.id_document_path ? (idUrlMap[m.id_document_path] ?? null) : null,
    created_at: m.created_at,
  }))

  const paymentsWithNames = payments.map(p => ({
    ...p,
    member_name: nameById[p.user_id] ?? p.user_id.slice(0, 8),
  }))

  const reportsWithNames = reports.map(r => ({
    ...r,
    status: (r.status ?? 'pending') as string,
    reporter_name: nameById[r.reporter_id] ?? r.reporter_id.slice(0, 8),
    reported_name: nameById[r.reported_id] ?? r.reported_id.slice(0, 8),
    reporter_member_id: memberIdById[r.reporter_id] ?? '#' + r.reporter_id.slice(0, 8).toUpperCase(),
    reported_member_id: memberIdById[r.reported_id] ?? '#' + r.reported_id.slice(0, 8).toUpperCase(),
    reported_id: r.reported_id,
  }))

  return (
    <AdminClient
      stats={stats}
      members={members}
      meetings={meetingsWithNames}
      reveals={revealsWithNames}
      planCounts={planCounts}
      idVerifications={idVerifications}
      tickets={tickets}
      reports={reportsWithNames}
      payments={paymentsWithNames}
    />
  )
}

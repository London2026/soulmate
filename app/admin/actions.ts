'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'london.anup@gmail.com'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Not authorized')
}

export async function verifyMember(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ id_verified: true }).eq('id', profileId)
}

export async function rejectMemberId(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ id_document_path: null, id_country: null }).eq('id', profileId)
}

export async function updateMemberCRM(profileId: string, data: { crm_status?: string; crm_notes?: string }): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update(data).eq('id', profileId)
}

export async function markMemberContacted(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ crm_last_contacted: new Date().toISOString() }).eq('id', profileId)
}

export async function updateTicket(ticketId: string, data: { status?: string; admin_notes?: string }): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('support_tickets').update({ ...data, updated_at: new Date().toISOString() }).eq('id', ticketId)
}

export async function suspendMember(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ suspended: true }).eq('id', profileId)
}

export async function unsuspendMember(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ suspended: false }).eq('id', profileId)
}

export async function updateReportStatus(reportId: string, status: 'pending' | 'dismissed' | 'acted_on'): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('reports').update({ status }).eq('id', reportId)
}

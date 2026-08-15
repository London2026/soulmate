'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentReceiptEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'
import { PIXXLES_PLAN_PRICES, PIXXLES_CURRENCY } from '@/lib/pixxles'

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

export async function updateMemberProfile(
  profileId: string,
  data: { full_name?: string; age?: number; gender?: string; city?: string; country?: string }
): Promise<void> {
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

export async function resendPaymentReceipt(paymentId: string): Promise<{ error?: string }> {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('pixxles_payments')
    .select('user_id, plan, transaction_id, checkout_id, status')
    .eq('id', paymentId)
    .single()

  if (!payment) return { error: 'Payment not found.' }
  if (payment.status !== 'success') return { error: 'This payment was not successful, so no receipt can be sent.' }

  const { data: { user: buyer } } = await admin.auth.admin.getUserById(payment.user_id)
  if (!buyer?.email) return { error: "Could not find this member's email address." }

  const buyerName = (buyer.user_metadata?.full_name as string | undefined) ?? 'Member'
  const amount = PIXXLES_PLAN_PRICES[payment.plan] ?? 0
  await sendPaymentReceiptEmail(
    buyer.email,
    firstNameOnly(buyerName),
    payment.plan,
    amount,
    PIXXLES_CURRENCY,
    payment.transaction_id ?? payment.checkout_id,
  )

  return {}
}

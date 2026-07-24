import { createAdminClient } from '@/lib/supabase/admin'

// Paid plan keys and their price, kept in one place so a checkout amount can
// never be trusted from the client — only ever looked up here server-side.
export const PIXXLES_PLAN_PRICES: Record<string, number> = {
  starter: 6.0,
  standard: 9.0,
}

export const PIXXLES_CURRENCY = 'USD'

function config() {
  const baseUrl = process.env.PIXXLES_BASE_URL
  const entityId = process.env.PIXXLES_ENTITY_ID
  const authToken = process.env.PIXXLES_AUTH_TOKEN
  if (!baseUrl || !entityId || !authToken) {
    throw new Error('Pixxles is not configured — missing PIXXLES_BASE_URL/PIXXLES_ENTITY_ID/PIXXLES_AUTH_TOKEN')
  }
  return { baseUrl, entityId, authToken }
}

// Official OPPWA "successful or pending" result-code pattern used by
// COPYandPAY integrations. Anything that doesn't match is treated as failed.
const SUCCESS_CODE = /^(000\.000\.|000\.100\.1|000\.[36])/

interface OppwaResponse {
  id?: string
  result?: { code?: string; description?: string }
  [key: string]: unknown
}

async function oppwaRequest(path: string, options: { method: 'GET' | 'POST'; body?: URLSearchParams }): Promise<OppwaResponse> {
  const { baseUrl, authToken } = config()
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${authToken}`,
      ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: options.body,
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as OppwaResponse
  if (!res.ok) {
    throw new Error(data.result?.description || `Pixxles request failed (${res.status})`)
  }
  return data
}

export async function createCheckout(userId: string, plan: string): Promise<{ checkoutId: string; widgetSrc: string }> {
  const amount = PIXXLES_PLAN_PRICES[plan]
  if (!amount) throw new Error(`Unknown plan: ${plan}`)
  const { entityId, baseUrl } = config()

  const body = new URLSearchParams({
    entityId,
    amount: amount.toFixed(2),
    currency: PIXXLES_CURRENCY,
    paymentType: 'DB',
    merchantTransactionId: `${userId}-${Date.now()}`,
  })

  const data = await oppwaRequest('/v1/checkouts', { method: 'POST', body })
  if (!data.id) throw new Error(data.result?.description || 'Pixxles did not return a checkout id')

  const admin = createAdminClient()
  const { error } = await admin.from('pixxles_payments').insert({
    checkout_id: data.id,
    user_id: userId,
    plan,
    amount,
    currency: PIXXLES_CURRENCY,
    status: 'pending',
  })
  if (error) throw new Error(error.message)

  return { checkoutId: data.id, widgetSrc: `${baseUrl}/v1/paymentWidgets.js?checkoutId=${data.id}` }
}

export interface VerifyResult {
  ok: boolean
  success: boolean
  alreadyProcessed: boolean
  plan?: string
  resultCode?: string
  message?: string
}

// Single source of truth for "did this checkout actually succeed" — called
// by both the shopper-facing result page and the webhook. Always re-checks
// against Pixxles directly rather than trusting whatever triggered the call,
// and is safe to call more than once for the same checkout.
export async function verifyAndApplyCheckout(checkoutId: string): Promise<VerifyResult> {
  const admin = createAdminClient()
  const { entityId } = config()

  const { data: row } = await admin
    .from('pixxles_payments')
    .select('id, user_id, plan, status')
    .eq('checkout_id', checkoutId)
    .maybeSingle()

  if (!row) return { ok: false, success: false, alreadyProcessed: false, message: 'Unknown checkout' }
  if (row.status === 'success') {
    return { ok: true, success: true, alreadyProcessed: true, plan: row.plan }
  }

  const data = await oppwaRequest(`/v1/checkouts/${checkoutId}/payment?entityId=${entityId}`, { method: 'GET' })
  const resultCode = data.result?.code ?? ''
  const success = SUCCESS_CODE.test(resultCode)

  await admin.from('pixxles_payments').update({
    status: success ? 'success' : 'failed',
    result_code: resultCode,
    transaction_id: (data.id as string) ?? null,
    updated_at: new Date().toISOString(),
  }).eq('checkout_id', checkoutId)

  if (success) {
    await admin.from('profiles').update({
      plan: row.plan,
      plan_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', row.user_id)
  }

  return { ok: true, success, alreadyProcessed: false, plan: row.plan, resultCode, message: data.result?.description }
}

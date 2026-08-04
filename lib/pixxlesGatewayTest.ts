// Isolated helper for the one-off £1 production-gateway verification
// transaction Pixxles requested. Deliberately separate from lib/pixxles.ts —
// this never touches the pixxles_payments table or any customer's profile,
// since it isn't a real subscription, just proof the production credentials
// and gateway URL are wired up correctly.

const TEST_AMOUNT = '1.00'
const TEST_CURRENCY = 'GBP'

function config() {
  const baseUrl = process.env.PIXXLES_PROD_BASE_URL
  const entityId = process.env.PIXXLES_PROD_ENTITY_ID
  const authToken = process.env.PIXXLES_PROD_AUTH_TOKEN
  if (!baseUrl || !entityId || !authToken) {
    throw new Error('Pixxles production credentials are not configured — missing PIXXLES_PROD_BASE_URL/PIXXLES_PROD_ENTITY_ID/PIXXLES_PROD_AUTH_TOKEN')
  }
  return { baseUrl, entityId, authToken }
}

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

export async function createGatewayTestCheckout(): Promise<{ checkoutId: string; widgetSrc: string }> {
  const { entityId, baseUrl } = config()

  const body = new URLSearchParams({
    entityId,
    amount: TEST_AMOUNT,
    currency: TEST_CURRENCY,
    paymentType: 'DB',
    merchantTransactionId: `gateway-verify-${Date.now()}`,
  })

  const data = await oppwaRequest('/v1/checkouts', { method: 'POST', body })
  if (!data.id) throw new Error(data.result?.description || 'Pixxles did not return a checkout id')

  return { checkoutId: data.id, widgetSrc: `${baseUrl}/v1/paymentWidgets.js?checkoutId=${data.id}` }
}

export async function checkGatewayTestStatus(checkoutId: string): Promise<{ resultCode: string; description: string; raw: OppwaResponse }> {
  const { entityId } = config()
  const data = await oppwaRequest(`/v1/checkouts/${checkoutId}/payment?entityId=${entityId}`, { method: 'GET' })
  return {
    resultCode: data.result?.code ?? '',
    description: data.result?.description ?? '',
    raw: data,
  }
}

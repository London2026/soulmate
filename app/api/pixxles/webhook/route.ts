import { NextRequest } from 'next/server'
import { verifyAndApplyCheckout } from '@/lib/pixxles'

// Best-effort webhook receiver.
//
// Pixxles/OPPWA's real asynchronous notification format (payload shape,
// signing/encryption scheme) is configured per-merchant in their back office
// and wasn't provided at integration time, so this endpoint deliberately does
// NOT trust the notification body for payment status. It only uses it to
// find *which* checkout to re-check, then calls the same
// verifyAndApplyCheckout() used by the shopper-facing result page — which
// re-queries Pixxles directly before updating anything. That makes this
// endpoint safe to expose even without knowing Pixxles' exact signing
// scheme, since a forged/garbage POST can only trigger a status re-check,
// never force a plan upgrade by itself.
//
// If Pixxles later provides a signature header/secret scheme for this
// endpoint, verify it here before proceeding.
function extractCheckoutId(payload: Record<string, unknown>): string | null {
  const direct = payload.id ?? payload.checkoutId ?? payload.checkout_id
  if (typeof direct === 'string' && direct) return direct

  const resourcePath = payload.resourcePath
  if (typeof resourcePath === 'string') {
    const match = resourcePath.match(/\/v1\/checkouts\/([^/]+)\/payment/)
    if (match?.[1]) return match[1]
  }
  return null
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.PIXXLES_WEBHOOK_SECRET
  if (expectedSecret) {
    const providedSecret = request.nextUrl.searchParams.get('secret')
    if (providedSecret !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown> = {}
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else {
      const form = await request.formData()
      payload = Object.fromEntries(form.entries())
    }
  } catch {
    return Response.json({ error: 'Unreadable payload' }, { status: 400 })
  }

  const checkoutId = extractCheckoutId(payload)
  if (!checkoutId) {
    return Response.json({ error: 'No checkout reference in payload' }, { status: 400 })
  }

  try {
    const result = await verifyAndApplyCheckout(checkoutId)
    return Response.json({ received: true, success: result.success })
  } catch (err) {
    console.error('Pixxles webhook verification failed:', err)
    // Still acknowledge receipt so the provider doesn't retry forever on a
    // transient error on our side; the result page remains a second chance
    // to reconcile the same checkout.
    return Response.json({ received: true, error: 'Verification failed' }, { status: 200 })
  }
}

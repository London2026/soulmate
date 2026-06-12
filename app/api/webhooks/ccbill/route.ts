import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendAdminNewSubscriberEmail } from '@/lib/sendEmail'
import { extractUserId, productForSubaccount, verifyWebhookSource } from '@/lib/ccbill'

// CCBill webhook (JSON format). Configured per sub-account in the CCBill
// admin, pointing at https://www.mysoulmate.live/api/webhooks/ccbill.
export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!payload) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  // Logged for first-run debugging against a live account — remove once
  // field names (eventType, clientSubacc, X-userId, subscriptionId) are confirmed.
  console.log('[ccbill webhook]', JSON.stringify(payload))

  if (!verifyWebhookSource(payload)) {
    return NextResponse.json({ error: 'Unrecognized source' }, { status: 403 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const eventType = String(payload.eventType ?? payload.event_type ?? '')
  const subAccount = String(payload.clientSubacc ?? payload.clientSubAcc ?? '')
  const subscriptionId = payload.subscriptionId ? String(payload.subscriptionId) : null
  const product = productForSubaccount(subAccount)

  switch (eventType) {

    // ── Payment succeeded → activate plan / record purchase ──────────
    case 'NewSaleSuccess': {
      const userId = extractUserId(payload)
      if (!userId) break

      if (product === 'extra_meeting') {
        await supabaseAdmin.from('extra_meeting_purchases').insert({
          user_id: userId,
          payment_reference: subscriptionId,
        })
      } else if (product === 'starter' || product === 'standard') {
        await supabaseAdmin.from('profiles').update({
          plan: product,
          ccbill_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        const { data: profile } = await supabaseAdmin
          .from('profiles').select('full_name').eq('id', userId).single()
        const memberName = profile?.full_name ?? 'Unknown member'
        await sendAdminNewSubscriberEmail(memberName, product)
      }
      break
    }

    // ── Subscription renewed → keep plan active ──────────────────────
    case 'RenewalSuccess': {
      if (subscriptionId) {
        await supabaseAdmin.from('profiles').update({
          updated_at: new Date().toISOString(),
        }).eq('ccbill_subscription_id', subscriptionId)
      }
      break
    }

    // ── Subscription ended → revert to free ──────────────────────────
    case 'Cancellation':
    case 'Expiration':
    case 'RenewalFailure':
    case 'Refund':
    case 'Chargeback':
    case 'Void': {
      if (subscriptionId) {
        await supabaseAdmin.from('profiles').update({
          plan: 'free',
          updated_at: new Date().toISOString(),
        }).eq('ccbill_subscription_id', subscriptionId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

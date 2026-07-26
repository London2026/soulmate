'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useSearchParams } from 'next/navigation'

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82',
  border: 'rgba(13,31,60,0.15)', rose: '#9e2a2b',
}

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  starter: { name: 'Starter', price: '$6.00 / month' },
  standard: { name: 'Standard', price: '$9.00 / month' },
}

const STYLE = `
  .checkout-page { min-height:100dvh; background:#f4f1eb; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 1rem; box-sizing:border-box; }
  .checkout-home-btn { position:fixed; top:1rem; left:1rem; display:flex; align-items:center; gap:0.4rem; font-family:Raleway,sans-serif; font-size:0.68rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#5a6e82; text-decoration:none; padding:0.5rem 0.85rem; border:1px solid rgba(13,31,60,0.15); border-radius:6px; background:rgba(244,241,235,0.9); }
  .checkout-card { width:100%; max-width:460px; background:#fff; border-radius:10px; box-shadow:0 16px 60px rgba(13,31,60,0.12); border:1px solid rgba(13,31,60,0.15); overflow:hidden; }
  .checkout-head { padding:1.8rem 2rem 1.4rem; border-bottom:1px solid rgba(13,31,60,0.15); text-align:center; background:#f4f1eb; }
  .checkout-body { padding:1.75rem 2rem; }
  @media (max-width:600px) {
    .checkout-page { justify-content:flex-start; padding-top:1.25rem; padding-bottom:1.5rem; }
    .checkout-head { padding:1.25rem 1rem 1rem !important; }
    .checkout-body { padding:1.25rem 1rem !important; }
  }
  /* Give the injected COPYandPAY form breathing room and full width */
  form.paymentWidgets { width: 100%; }
  /* The site's root layout sets white body text globally; the widget's
     input fields don't set their own color, so typed text was inheriting
     white on a white input background and appeared invisible. */
  form.paymentWidgets input,
  form.paymentWidgets select,
  form.paymentWidgets label {
    color: #0d1f3c !important;
  }
`

function CheckoutForm() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? ''
  const planInfo = PLAN_LABELS[plan]

  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [widgetSrc, setWidgetSrc] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!!planInfo)
  const requested = useRef(false)

  useEffect(() => {
    if (!planInfo) return
    if (requested.current) return
    requested.current = true

    fetch('/api/pixxles/prepare-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not start checkout.')
        setCheckoutId(data.checkoutId)
        setWidgetSrc(data.widgetSrc)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not start checkout.'))
      .finally(() => setLoading(false))
  }, [plan, planInfo])

  return (
    <div className="checkout-page">
      <style>{STYLE}</style>
      <Link href="/pricing" className="checkout-home-btn">← Back to Pricing</Link>
      <img src="/banduraa-logo.png" alt="Banduraa" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 6px 30px rgba(13,31,60,0.13)', display: 'block', margin: '0 auto 1.5rem' }} />

      <div className="checkout-card">
        <div className="checkout-head">
          <h2 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1.5rem', fontWeight: 600, color: c.navy, margin: '0 0 0.3rem' }}>
            {planInfo ? `Subscribe to ${planInfo.name}` : 'Checkout'}
          </h2>
          {planInfo && (
            <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.05rem', fontStyle: 'italic', color: c.sepia, margin: 0 }}>
              {planInfo.price}
            </p>
          )}
        </div>
        <div className="checkout-body">
          {!planInfo && (
            <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.85rem 1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond",serif', textAlign: 'center' }}>
              Unknown plan.
            </div>
          )}

          {loading && (
            <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1rem', color: c.sepia, textAlign: 'center' }}>
              Preparing secure checkout…
            </p>
          )}

          {error && (
            <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.85rem 1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond",serif', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {checkoutId && widgetSrc && (
            <>
              <form action="/payment/result" className="paymentWidgets" data-brands="VISA MASTER AMEX" />
              <Script key={checkoutId} src={widgetSrc} strategy="afterInteractive" />
            </>
          )}
        </div>
      </div>
      <p style={{ marginTop: '1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.1em', color: '#5a6e82', textAlign: 'center' }}>
        Payments are processed securely by Pixxles. Card details never touch our servers.
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c',
  gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82',
  border: 'rgba(13,31,60,0.15)', rose: '#9e2a2b',
}

const STYLE = `
  .gwtest-page { min-height:100dvh; background:#f4f1eb; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:2.5rem 1rem; box-sizing:border-box; }
  .gwtest-card { width:100%; max-width:460px; background:#fff; border-radius:10px; box-shadow:0 16px 60px rgba(13,31,60,0.12); border:1px solid rgba(13,31,60,0.15); overflow:hidden; }
  .gwtest-head { padding:1.8rem 2rem 1.4rem; border-bottom:1px solid rgba(13,31,60,0.15); text-align:center; background:#f4f1eb; }
  .gwtest-body { padding:1.75rem 2rem; }
  form.paymentWidgets { width: 100%; }
  form.paymentWidgets input, form.paymentWidgets select, form.paymentWidgets label { color: #0d1f3c !important; }
  /* Card number / CVV are cross-origin <iframe>s; the widget copies the outer
     iframe's own computed color/background into the inner field on mount,
     so that's the only way to fix invisible white-on-white typed text. */
  .wpwl-control-iframe { color: #0d1f3c !important; background-color: #ffffff !important; }
`

export default function GatewayTestClient() {
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [widgetSrc, setWidgetSrc] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    if (!started || requested.current) return
    requested.current = true
    setLoading(true)

    fetch('/api/pixxles/gateway-test/prepare', { method: 'POST' })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not start checkout.')
        setCheckoutId(data.checkoutId)
        setWidgetSrc(data.widgetSrc)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not start checkout.'))
      .finally(() => setLoading(false))
  }, [started])

  return (
    <div className="gwtest-page">
      <style>{STYLE}</style>
      <div className="gwtest-card">
        <div className="gwtest-head">
          <h2 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1.4rem', fontWeight: 600, color: c.navy, margin: '0 0 0.3rem' }}>
            Pixxles Gateway Verification
          </h2>
          <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1rem', fontStyle: 'italic', color: c.sepia, margin: 0 }}>
            £1.00 GBP — production gateway
          </p>
        </div>
        <div className="gwtest-body">
          {!started && (
            <>
              <div style={{ background: 'rgba(158,42,43,0.06)', border: `1px solid ${c.border}`, borderRadius: '6px', padding: '0.9rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.95rem', color: c.navy, margin: 0, lineHeight: 1.6 }}>
                  This charges a real <strong>£1.00</strong> to whatever card is entered below, via Pixxles&apos; live production gateway. Use a real bank card you control. This is for gateway verification only — it does not affect any customer account or subscription.
                </p>
              </div>
              <button onClick={() => setStarted(true)}
                style={{ width: '100%', padding: '0.9rem', background: c.navy, color: c.goldLight, border: 'none', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                I understand — Start £1 Test →
              </button>
            </>
          )}

          {started && loading && (
            <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1rem', color: c.sepia, textAlign: 'center' }}>
              Preparing checkout…
            </p>
          )}

          {error && (
            <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.85rem 1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond",serif', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {checkoutId && widgetSrc && (
            <>
              <form action="/admin/gateway-test/result" className="paymentWidgets" data-brands="VISA MASTER AMEX" />
              <Script
                id={`wpwl-options-${checkoutId}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `window.wpwlOptions = { style: "plain", locale: "en" };`,
                }}
              />
              <Script key={checkoutId} src={widgetSrc} strategy="afterInteractive" />
            </>
          )}
        </div>
      </div>
      <p style={{ marginTop: '1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.1em', color: '#5a6e82', textAlign: 'center' }}>
        Internal tool — <Link href="/admin" style={{ color: c.sepia }}>Back to Admin</Link>
      </p>
    </div>
  )
}

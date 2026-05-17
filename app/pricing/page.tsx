'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { createClient } from '@/lib/supabase/client'

const c = {
  navy: '#0d1f3c', navyMid: '#152240', cream: '#f4f1eb',
  gold: '#8b6914', goldLight: '#c9a84c', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', sepia: '#5a6e82', border: 'rgba(201,168,76,0.18)',
}

const plans = [
  {
    name: 'Starter',
    price: '$6',
    period: '/month',
    billing: 'Billed $6 every month',
    tagline: 'Begin your journey',
    cta: 'Get Started',
    highlighted: false,
    meetings: 2,
    features: [
      'Full profile with voice introduction',
      'Back-side photo upload (2 photos)',
      'Browse & discover all profiles',
      'Unlimited photo reveals',
      'See who revealed your photo',
      '2 video meeting bookings/month',
    ],
  },
  {
    name: 'Standard',
    price: '$9',
    period: '/month',
    billing: 'Billed $9 every month',
    tagline: 'Most popular',
    cta: 'Start Standard',
    highlighted: true,
    meetings: 4,
    features: [
      'Full profile with voice introduction',
      'Back-side photo upload (2 photos)',
      'Browse & discover all profiles',
      'Unlimited photo reveals',
      'See who revealed your photo',
      '4 video meeting bookings/month',
    ],
  },
]

export default function PricingPage() {
  const [ctaHref, setCtaHref] = useState('/signup')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCtaHref('/onboarding')
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />
      <Navigation />

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '7rem 1rem 4rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ display: 'inline-block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.3rem 1rem', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, color: c.goldLight, borderRadius: '20px', marginBottom: '1.25rem' }}>
            Monthly subscription · Cancel anytime
          </span>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.6rem', fontWeight: 700, color: c.ivory, margin: '0 0 0.75rem', lineHeight: 1.2 }}>
            Invest in your <br /><span style={{ color: c.goldLight }}>forever</span>
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontStyle: 'italic', color: c.ivoryDim, maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Both plans include full access. Choose based on how many video meetings you need.
          </p>
          <div style={{ height: '1px', width: '80px', background: `linear-gradient(to right, transparent, ${c.goldLight}, transparent)`, margin: '0 auto' }} />
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ position: 'relative', background: c.navyMid, border: plan.highlighted ? `1px solid ${c.goldLight}` : `1px solid ${c.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: plan.highlighted ? '0 0 40px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.4)' }}>

              {plan.highlighted && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.25rem 1rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  ✦ Most Popular
                </div>
              )}

              {/* Header */}
              <div style={{ padding: '1.75rem 1.5rem 1.25rem', borderBottom: `1px solid rgba(201,168,76,0.1)` }}>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: plan.highlighted ? c.goldLight : c.ivoryDim, margin: '0 0 0.4rem' }}>{plan.tagline}</p>
                <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 1rem' }}>{plan.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.5rem', fontWeight: 700, color: plan.highlighted ? c.goldLight : c.ivory }}>{plan.price}</span>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.ivoryDim }}>{plan.period}</span>
                </div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.ivoryDim, margin: '0 0 1rem', letterSpacing: '0.05em' }}>{plan.billing}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.9rem', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🎥</span>
                  <div>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: c.ivory, margin: 0 }}>{plan.meetings} video meetings/month</p>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: c.ivoryDim, margin: 0 }}>included</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul style={{ padding: '1.25rem 1.5rem', flex: 1, margin: 0, listStyle: 'none' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.65rem' }}>
                    <span style={{ color: c.goldLight, fontSize: '0.8rem', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: c.ivory, lineHeight: 1.4 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div style={{ padding: '0 1.5rem 1.75rem' }}>
                <a href={ctaHref} style={{ display: 'block', width: '100%', padding: '0.85rem', textAlign: 'center', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s', ...(plan.highlighted ? { background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, boxShadow: '0 4px 16px rgba(201,168,76,0.25)' } : { border: `1px solid rgba(201,168,76,0.35)`, color: c.goldLight, background: 'transparent' }) }}>
                  {plan.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Extra meetings */}
        <div style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>➕</div>
            <div>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>Need more meetings?</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', fontStyle: 'italic', color: c.ivoryDim, margin: 0 }}>Buy additional video meeting requests anytime.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.75rem', fontWeight: 700, color: c.goldLight, margin: '0 0 0.1rem' }}>$3</p>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', color: c.ivoryDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>per extra meeting</p>
          </div>
        </div>

        {/* Trust */}
        <div style={{ background: c.navyMid, border: `1px solid rgba(201,168,76,0.1)`, borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {[
            { icon: '🔒', label: 'Privacy First', desc: 'Face photos hidden until mutual reveal' },
            { icon: '🎙️', label: 'Voice-Led', desc: 'Personality before appearance' },
            { icon: '↩️', label: 'Cancel Anytime', desc: 'No lock-in, no hidden fees' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{t.icon}</span>
              <div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.ivory, margin: '0 0 0.2rem' }}>{t.label}</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', fontStyle: 'italic', color: c.ivoryDim, margin: 0 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', letterSpacing: '0.08em', color: 'rgba(189,181,166,0.35)', marginTop: '1.5rem' }}>
          Prices in USD · Renews monthly · Cancel before next billing date
        </p>

      </main>
    </div>
  )
}

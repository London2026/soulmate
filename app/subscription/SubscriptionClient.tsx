'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription } from '@/app/profile/actions'

const c = {
  bg: '#07111f', navy: '#0d1f3c', gold: '#c9a84c',
  sepia: '#5a6e82', ivory: '#f5f0e6', border: 'rgba(201,168,76,0.18)',
  text: '#e8e3d8', rose: '#9e2a2b',
}

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: null,
    features: [
      { label: 'Browse member profiles', included: true },
      { label: 'Back-photo reveals', value: 'None', included: false },
      { label: 'Video meetings / month', value: 'None', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'starter',
    label: 'Starter',
    price: 6,
    highlight: false,
    features: [
      { label: 'Browse member profiles', included: true },
      { label: 'Back-photo reveals', value: '2 / month', included: true },
      { label: 'Video meetings / month', value: '2 / month', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'standard',
    label: 'Standard',
    price: 9,
    highlight: true,
    features: [
      { label: 'Browse member profiles', included: true },
      { label: 'Back-photo reveals', value: '4 / month', included: true },
      { label: 'Video meetings / month', value: '4 / month', included: true },
      { label: 'Priority support', included: true },
    ],
  },
]

function planBadge(plan: string) {
  if (plan === 'standard') return { label: 'Standard', color: '#4ade80', bg: 'rgba(46,125,82,0.2)' }
  if (plan === 'starter')  return { label: 'Starter',  color: c.gold,    bg: 'rgba(201,168,76,0.15)' }
  return                          { label: 'Free',     color: c.sepia,   bg: 'rgba(232,227,216,0.08)' }
}

function nextRenewal(planStartedAt: string | null): string | null {
  if (!planStartedAt) return null
  const start = new Date(planStartedAt)
  const now = new Date()
  // Advance start by whole months until it's in the future
  const next = new Date(start)
  while (next <= now) {
    next.setMonth(next.getMonth() + 1)
  }
  return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SubscriptionClient({
  plan, memberId, memberSince, planStartedAt,
}: {
  plan: string; memberId: string | null; memberSince: string; planStartedAt: string | null
}) {
  const router = useRouter()
  const [showCancel, setShowCancel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const badge = planBadge(plan)
  const isPaid = plan !== 'free'
  const renewal = isPaid ? nextRenewal(planStartedAt) : null

  async function handleCancel() {
    setLoading(true); setError('')
    try {
      await cancelSubscription()
      setShowCancel(false)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        .sub-plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 2rem; }
        @media (max-width: 520px) { .sub-plan-grid { grid-template-columns: 1fr; } }
        .sub-h1 { font-size: 2rem; }
        @media (max-width: 600px) { .sub-h1 { font-size: 1.5rem; } }
      `}</style>
      {/* Heading */}
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.4rem' }}>
        ✦ Subscription
      </p>
      <h1 className="sub-h1" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600, color: c.ivory, margin: '0 0 0.35rem' }}>
        Manage Your Plan
      </h1>
      <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)', marginBottom: '2rem' }} />

      {/* Current plan summary card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`, borderRadius: 10, padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.75rem' }}>Current Plan</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.6rem', color: c.ivory }}>{badge.label}</span>
              <span style={{ padding: '0.2rem 0.75rem', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: badge.bg, color: badge.color }}>
                {isPaid ? 'Active' : 'Free'}
              </span>
            </div>
            {isPaid && (
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: c.sepia, margin: '0 0 0.25rem' }}>
                ${PLANS.find(p => p.id === plan)?.price}/month · billed monthly
              </p>
            )}
            {renewal && (
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, margin: '0 0 0.2rem' }}>
                Next renewal: <span style={{ color: c.ivory }}>{renewal}</span>
              </p>
            )}
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, margin: 0 }}>
              Member since {new Date(memberSince).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              {memberId && <span style={{ fontFamily: 'monospace', marginLeft: '0.75rem', opacity: 0.7 }}>{memberId}</span>}
            </p>
          </div>
          {isPaid && (
            <button onClick={() => setShowCancel(true)}
              style={{ padding: '0.55rem 1.25rem', background: 'transparent', border: '1px solid rgba(158,42,43,0.35)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
              Cancel Plan
            </button>
          )}
        </div>
      </div>

      {/* Plan comparison */}
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 1rem' }}>
        {isPaid ? 'All Plans' : 'Choose a Plan'}
      </p>
      <div className="sub-plan-grid">
        {PLANS.map(p => {
          const isCurrent = p.id === plan
          const isHigher = (p.id === 'standard' && plan !== 'standard') || (p.id === 'starter' && plan === 'free')
          return (
            <div key={p.id} style={{ background: isCurrent ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isCurrent ? 'rgba(201,168,76,0.35)' : c.border}`, borderRadius: 10, padding: '1.25rem 1rem', position: 'relative', display: 'flex', flexDirection: 'column' as const }}>
              {(p as typeof p & { highlight?: boolean }).highlight && !isCurrent && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0.2rem 0.65rem', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: badge.bg, border: `1px solid ${badge.color}`, color: badge.color, fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0.2rem 0.65rem', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  Current Plan
                </div>
              )}
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.05rem', fontWeight: 600, color: c.ivory, margin: '0.5rem 0 0.2rem' }}>
                {p.label}
              </p>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: p.price ? c.gold : c.sepia, margin: '0 0 1rem', fontWeight: 600 }}>
                {p.price ? `$${p.price}/mo` : 'Free'}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', flex: 1 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: f.included ? c.text : c.sepia, padding: '0.3rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', borderBottom: i < p.features.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>{f.included ? '✓' : '–'}</span>
                    <span>{f.value ?? f.label}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div style={{ textAlign: 'center' as const, padding: '0.5rem', background: 'rgba(201,168,76,0.08)', borderRadius: 4, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: c.sepia, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Active
                </div>
              ) : isHigher ? (
                <a href="/pricing" style={{ display: 'block', textAlign: 'center' as const, padding: '0.55rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, textDecoration: 'none', borderRadius: 4 }}>
                  Upgrade →
                </a>
              ) : (
                <div style={{ padding: '0.5rem', borderRadius: 4, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia, textAlign: 'center' as const }}>
                  Downgrade
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ-style note */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${c.border}`, borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.5rem' }}>About billing</p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: c.sepia, lineHeight: 1.7, margin: 0 }}>
          Plans are billed monthly. You can cancel at any time and you will retain access until the end of your current billing period. Unused reveals and meetings do not carry over.
        </p>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d1f3c', border: `1px solid ${c.border}`, borderRadius: 10, padding: '2rem', maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', color: c.ivory, margin: '0 0 0.75rem' }}>Cancel your plan?</h3>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: c.sepia, lineHeight: 1.7, margin: '0 0 0.75rem' }}>
              Your account will be downgraded to <strong style={{ color: c.ivory }}>Free</strong> immediately. You will lose access to photo reveals and video meetings.
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: c.sepia, margin: '0 0 1.5rem' }}>
              You can upgrade again at any time from this page.
            </p>
            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancel(false)} disabled={loading}
                style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: `1px solid ${c.border}`, color: c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, borderRadius: 4, cursor: 'pointer' }}>
                Keep Plan
              </button>
              <button onClick={handleCancel} disabled={loading}
                style={{ padding: '0.6rem 1.25rem', background: 'rgba(158,42,43,0.2)', border: '1px solid rgba(158,42,43,0.5)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: 4, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '$6',
    period: 'per month',
    billing: 'Billed $6 every month',
    tagline: 'Begin your journey',
    cta: 'Get Started',
    ctaHref: '/signup',
    highlighted: false,
    meetings: 2,
    features: [
      'Full profile with voice introduction',
      'Back-side photo upload (2 photos)',
      'Browse & discover all profiles',
      'Unlimited photo reveals',
      'See who revealed your photo',
      '2 video meeting bookings included',
    ],
  },
  {
    name: 'Standard',
    price: '$9',
    period: 'per month',
    billing: 'Billed $9 every month',
    tagline: 'Most popular',
    cta: 'Start Standard',
    ctaHref: '/signup',
    highlighted: true,
    meetings: 4,
    features: [
      'Full profile with voice introduction',
      'Back-side photo upload (2 photos)',
      'Browse & discover all profiles',
      'Unlimited photo reveals',
      'See who revealed your photo',
      '4 video meeting bookings included',
    ],
  },
]

const trust = [
  { icon: '🔒', label: 'Privacy First', desc: 'Face photos hidden until mutual reveal' },
  { icon: '🎙️', label: 'Voice-Led Matching', desc: 'Personality before appearance, always' },
  { icon: '↩️', label: 'Cancel Anytime', desc: 'No lock-in — cancel before your next billing date' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--oxford-navy)' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)' }}
      />

      <Navigation />

      <main className="mx-auto pt-28 pb-32 px-4 max-w-3xl">

        {/* ── Hero ── */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ backgroundColor: 'rgba(201,168,76,0.08)', color: 'var(--antique-gold)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            Monthly subscription · Cancel anytime
          </div>

          <h1
            className="text-4xl md:text-5xl tracking-wide mb-4"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
          >
            Invest in your <br />
            <span style={{ color: 'var(--antique-gold)' }}>forever</span>
          </h1>

          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--ivory-dim)' }}>
            Both plans include full access to discover, voice introductions, and photo reveals.
            Choose based on how many video meetings you need.
          </p>

          <div
            className="mx-auto mt-8 h-px w-32"
            style={{ background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }}
          />
        </div>

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl flex flex-col"
              style={
                plan.highlighted
                  ? {
                      backgroundColor: 'var(--oxford-navy-mid)',
                      border: '1px solid var(--antique-gold)',
                      boxShadow: '0 0 40px rgba(201,168,76,0.15), 0 8px 40px rgba(0,0,0,0.5)',
                    }
                  : {
                      backgroundColor: 'var(--oxford-navy-mid)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="px-4 py-1 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
                      color: 'var(--oxford-navy)',
                    }}
                  >
                    ✦ Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="px-7 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                <p
                  className="text-xs tracking-widest uppercase mb-1"
                  style={{ color: plan.highlighted ? 'var(--antique-gold)' : 'var(--ivory-dim)' }}
                >
                  {plan.tagline}
                </p>
                <h2
                  className="text-2xl mb-5"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
                >
                  {plan.name}
                </h2>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span
                    className="text-5xl font-bold"
                    style={{
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                      color: plan.highlighted ? 'var(--antique-gold)' : 'var(--ivory)',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--ivory-dim)' }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
                  {plan.billing}
                </p>

                {/* Meeting count highlight */}
                <div
                  className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}
                >
                  <span className="text-2xl">🎥</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ivory)' }}>
                      {plan.meetings} video meeting bookings
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
                      included per month
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="px-7 py-6 space-y-3.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-sm" style={{ color: 'var(--antique-gold)' }}>
                      ✓
                    </span>
                    <span className="text-sm leading-snug" style={{ color: 'var(--ivory)' }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="px-7 pb-8">
                <Link
                  href={plan.ctaHref}
                  className="block w-full py-3.5 rounded-xl text-sm font-semibold tracking-wider text-center transition-all duration-200"
                  style={
                    plan.highlighted
                      ? {
                          background: 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
                          color: 'var(--oxford-navy)',
                          boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
                        }
                      : {
                          border: '1px solid rgba(201,168,76,0.35)',
                          color: 'var(--antique-gold)',
                          backgroundColor: 'transparent',
                        }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── Extra meetings add-on ── */}
        <div
          className="rounded-2xl px-7 py-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
          style={{
            backgroundColor: 'var(--oxford-navy-mid)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              ➕
            </div>
            <div>
              <p
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
              >
                Need more meetings?
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ivory-dim)' }}>
                Purchase additional video meeting requests at any time during your subscription.
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--antique-gold)' }}
            >
              $3
            </p>
            <p className="text-xs" style={{ color: 'var(--ivory-dim)' }}>per extra meeting</p>
          </div>
        </div>

        {/* ── Trust bar ── */}
        <div
          className="rounded-2xl px-8 py-7 grid grid-cols-1 sm:grid-cols-3 gap-7"
          style={{ backgroundColor: 'var(--oxford-navy-mid)', border: '1px solid rgba(201,168,76,0.1)' }}
        >
          {trust.map((t) => (
            <div key={t.label} className="flex items-start gap-4">
              <span className="text-2xl shrink-0">{t.icon}</span>
              <div>
                <p
                  className="text-sm font-semibold mb-0.5"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
                >
                  {t.label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ivory-dim)' }}>
                  {t.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'rgba(189,181,166,0.35)' }}>
          Prices in USD. Subscription renews monthly unless cancelled before the next billing date.
        </p>

      </main>

      <BottomNav />
    </div>
  )
}

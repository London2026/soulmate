import Link from 'next/link'
import Navigation from '@/components/Navigation'

const c = {
  navy: '#0d1f3c', navyMid: '#152240', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.18)',
}

export default function PaymentSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />
      <Navigation />

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '8rem 1.5rem 4rem', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>
          💘
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.75rem' }}>
          Welcome to Soul Mate
        </h1>
        <div style={{ height: '1px', width: '60px', background: `linear-gradient(to right, transparent, ${c.goldLight}, transparent)`, margin: '0 auto 1.25rem' }} />
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.15rem', color: c.ivoryDim, margin: '0 0 2rem', lineHeight: 1.7 }}>
          Your subscription is active. You now have full access to photo reveals and video meeting requests. Your journey to finding your forever begins now.
        </p>

        {/* What's unlocked */}
        <div style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.9rem' }}>
            ✦ Now unlocked for you
          </p>
          {[
            '✓  Reveal face photos of members you like',
            '✓  See who has revealed your photo',
            '✓  Request video meetings with preferred date & time',
            '✓  Unlimited profile discovery',
          ].map(item => (
            <p key={item} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              {item}
            </p>
          ))}
        </div>

        {/* CTA */}
        <Link href="/discover"
          style={{ display: 'inline-block', padding: '0.9rem 2.5rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}>
          Start Discovering →
        </Link>

        <p style={{ marginTop: '1.25rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: 'rgba(189,181,166,0.4)', letterSpacing: '0.08em' }}>
          Monthly subscription · Cancel anytime before next billing date
        </p>
      </main>
    </div>
  )
}

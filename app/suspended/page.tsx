import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.8rem', color: '#e8e3d8', margin: '0 0 1rem' }}>
          Account Suspended
        </h1>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'rgba(232,227,216,0.65)', lineHeight: 1.75, margin: '0 0 2rem' }}>
          Your account has been temporarily suspended following a review of reported activity. If you believe this is a mistake, please contact our support team and we will look into it promptly.
        </p>
        <Link href="/support" style={{ display: 'inline-block', padding: '0.85rem 2rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4 }}>
          Contact Support →
        </Link>
      </div>
    </div>
  )
}

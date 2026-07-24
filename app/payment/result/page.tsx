import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { verifyAndApplyCheckout } from '@/lib/pixxles'

const c = {
  navy: '#0d1f3c', navyMid: '#152240', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.18)', rose: '#9e2a2b',
}

function extractCheckoutId(searchParams: Record<string, string | string[] | undefined>): string | null {
  const id = searchParams.id
  if (typeof id === 'string' && id) return id

  // Fallback: OPPWA also returns a resourcePath like /v1/checkouts/<id>/payment
  const resourcePath = searchParams.resourcePath
  const path = typeof resourcePath === 'string' ? resourcePath : undefined
  const match = path?.match(/\/v1\/checkouts\/([^/]+)\/payment/)
  return match?.[1] ?? null
}

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const checkoutId = extractCheckoutId(params)

  if (!checkoutId) {
    return (
      <FailureShell message="We couldn't find your checkout details. If you completed payment, please contact support before trying again." />
    )
  }

  let result
  try {
    result = await verifyAndApplyCheckout(checkoutId)
  } catch (err) {
    console.error('Pixxles result verification failed:', err)
    return (
      <FailureShell message="We couldn't confirm your payment right now. If you were charged, please contact support@banduraa.com." />
    )
  }

  if (result.success) {
    redirect('/pricing/success')
  }

  return (
    <FailureShell message={result.message || 'Your payment could not be completed. No charge was made, or it was declined by your bank.'} />
  )
}

function FailureShell({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <Navigation />
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '8rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.75rem' }}>
          Payment not completed
        </h1>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', color: c.ivoryDim, margin: '0 0 2rem', lineHeight: 1.7 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/pricing"
            style={{ display: 'inline-block', padding: '0.9rem 2rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none' }}>
            Try Again
          </Link>
          <Link href="/support"
            style={{ display: 'inline-block', padding: '0.9rem 2rem', border: `1px solid ${c.border}`, color: c.ivoryDim, fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none' }}>
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkGatewayTestStatus } from '@/lib/pixxlesGatewayTest'

const ADMIN_EMAIL = 'london.anup@gmail.com'

const c = {
  navy: '#0d1f3c', navyMid: '#152240', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.18)', rose: '#9e2a2b', green: '#4ade80',
}

function extractCheckoutId(searchParams: Record<string, string | string[] | undefined>): string | null {
  const id = searchParams.id
  if (typeof id === 'string' && id) return id
  const resourcePath = searchParams.resourcePath
  const path = typeof resourcePath === 'string' ? resourcePath : undefined
  const match = path?.match(/\/v1\/checkouts\/([^/]+)\/payment/)
  return match?.[1] ?? null
}

const SUCCESS_CODE = /^(000\.000\.|000\.100\.1|000\.[36])/

export default async function GatewayTestResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== ADMIN_EMAIL) redirect('/discover')

  const params = await searchParams
  const checkoutId = extractCheckoutId(params)

  let statusResult: { resultCode: string; description: string; raw: unknown } | null = null
  let statusError: string | null = null

  if (!checkoutId) {
    statusError = 'No checkout reference was returned in the redirect. Check the URL Pixxles sent the browser back to.'
  } else {
    try {
      statusResult = await checkGatewayTestStatus(checkoutId)
    } catch (err) {
      statusError = err instanceof Error ? err.message : 'Could not verify the transaction status.'
    }
  }

  let statusBlock
  if (statusError) {
    statusBlock = <ErrorBox message={statusError} />
  } else if (statusResult) {
    const { resultCode, description, raw } = statusResult
    const success = SUCCESS_CODE.test(resultCode)
    statusBlock = (
      <div style={{ background: c.navyMid, border: `1px solid ${success ? 'rgba(74,222,128,0.35)' : 'rgba(158,42,43,0.35)'}`, borderRadius: '12px', padding: '1.5rem 1.75rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: success ? c.green : c.rose, margin: '0 0 1rem' }}>
          {success ? '✓ Transaction Successful' : '✕ Transaction Not Successful'}
        </p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivory, margin: '0 0 0.5rem' }}>
          <strong>Result code:</strong> {resultCode || 'none returned'}
        </p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivory, margin: '0 0 0.5rem' }}>
          <strong>Description:</strong> {description || 'none returned'}
        </p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, margin: '0 0 1rem' }}>
          <strong>Checkout ID:</strong> {checkoutId}
        </p>
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: c.goldLight, cursor: 'pointer' }}>Full raw response</summary>
          <pre style={{ fontSize: '0.75rem', color: c.ivoryDim, whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.8rem', fontWeight: 600, color: c.ivory, margin: '0 0 1.5rem' }}>
          Gateway Verification Result
        </h1>
        {statusBlock}
        <p style={{ marginTop: '1.5rem' }}>
          <Link href="/admin/gateway-test" style={{ color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem' }}>← Run another test</Link>
          {' · '}
          <Link href="/admin" style={{ color: c.ivoryDim, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem' }}>Back to Admin</Link>
        </p>
      </main>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ background: 'rgba(158,42,43,0.1)', border: '1px solid rgba(158,42,43,0.35)', borderRadius: '12px', padding: '1.5rem 1.75rem', color: c.rose, fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem' }}>
      {message}
    </div>
  )
}

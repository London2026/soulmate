'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  burgundy: '#1b3a6b', gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', border: 'rgba(13,31,60,0.15)', rose: '#9e2a2b',
}
const inp = { width: '100%', padding: '0.75rem 0.9rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }
const lbl = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#2c4a6e', marginBottom: '0.4rem' }
const errBox = { background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', marginBottom: '1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond", serif', textAlign: 'center' as const }

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (error) {
      setError(error.message.includes('not found') || error.message.includes('registered')
        ? 'No account found with this email. Please sign up first.'
        : error.message)
      return
    }
    setStep('code')
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError('Please enter the full 6-digit code.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'email',
    })
    if (error) {
      setLoading(false)
      setError('Invalid or expired code. Please check your email and try again.')
      return
    }
    // Redirect based on profile state
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles').select('onboarding_complete, plan')
        .eq('id', data.user.id).maybeSingle()
      if (profile?.onboarding_complete) router.push('/discover')
      else if (profile?.plan) router.push('/onboarding')
      else router.push('/pricing')
    }
  }

  const Logo = () => (
    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
      <img src="/soulmate-logo-full.png" alt="Soul Mate" style={{ width: '160px', height: '160px', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 6px 30px rgba(13,31,60,0.13)' }} />
    </div>
  )

  if (step === 'code') {
    return (
      <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <Logo />
        <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '1.8rem 2rem 1.4rem', borderBottom: `1px solid ${c.border}`, textAlign: 'center', background: c.cream }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>📬</div>
            <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.5rem', fontWeight: 600, color: c.navy, margin: '0 0 0.25rem' }}>
              Enter your code
            </h2>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', fontStyle: 'italic', color: c.sepia, margin: 0 }}>
              We sent a 6-digit code to <strong style={{ color: c.navy, fontStyle: 'normal' }}>{email}</strong>
            </p>
          </div>
          <div style={{ padding: '1.75rem 2rem' }}>
            <form onSubmit={verifyCode}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  placeholder="000000"
                  autoFocus
                  style={{ ...inp, fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5em', fontFamily: '"Courier New", monospace', fontWeight: 700, padding: '0.9rem' }}
                  onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')}
                />
              </div>

              {error && <div style={errBox}>{error}</div>}

              <button type="submit" disabled={loading || code.length !== 6}
                style={{ width: '100%', padding: '0.9rem', background: (loading || code.length !== 6) ? c.navyMid : c.navy, color: c.goldLight, border: 'none', borderRadius: '4px', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: (loading || code.length !== 6) ? 'default' : 'pointer', transition: 'background 0.2s' }}>
                {loading ? 'Verifying…' : 'Sign In →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={async () => {
                setError(''); setCode('')
                const supabase = createClient()
                await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
                setError('A new code has been sent to your email.')
              }} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.08em', color: c.burgundy, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Resend code
              </button>
              <button onClick={() => { setStep('email'); setCode(''); setError('') }}
                style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.08em', color: c.sepia, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Use a different email
              </button>
            </div>
          </div>
        </div>
        <p style={{ marginTop: '1.25rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: c.sepia, textAlign: 'center' }}>
          Check your spam folder if you don&apos;t see the email
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <Logo />
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '1.8rem 2rem 1.4rem', borderBottom: `1px solid ${c.border}`, textAlign: 'center', background: c.cream }}>
          <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>Welcome Back</h2>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.sepia, margin: 0, fontStyle: 'italic' }}>Sign in to continue your journey</p>
        </div>
        <div style={{ padding: '1.75rem 2rem' }}>
          <form onSubmit={sendCode}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Email Address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} required
                placeholder="you@example.com" autoFocus style={inp}
                onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
            </div>

            {error && <div style={errBox}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.9rem', background: loading ? c.navyMid : c.navy, color: c.goldLight, border: 'none', borderRadius: '4px', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s' }}>
              {loading ? 'Sending…' : 'Send Verification Code →'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.sepia, margin: 0 }}>
              New to Soul Mate?{' '}
              <Link href="/signup" style={{ color: c.burgundy, fontWeight: 600, textDecoration: 'none' }}>Create your profile</Link>
            </p>
          </div>
        </div>
      </div>
      <p style={{ marginTop: '1.25rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: c.sepia, textAlign: 'center' }}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </p>
    </div>
  )
}

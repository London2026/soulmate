'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  burgundy: '#1b3a6b', gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', border: 'rgba(13,31,60,0.15)',
}

const inp = { width: '100%', padding: '0.7rem 0.9rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#2c4a6e', marginBottom: '0.4rem' }

export default function LoginPage() {
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    try {
      if (mode === 'password') {
        // Email + password login
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/discover')
      } else {
        // Magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSent(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg.includes('Invalid login credentials') ? 'Wrong email or password.' : msg)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>💘</div>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 700, color: c.navy, margin: '0 0 0.3rem' }}>Soul Mate</h1>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold, margin: 0 }}>✦ Find Your Forever ✦</p>
        </div>
        <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: '1px solid rgba(13,31,60,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.5rem' }}>Check your inbox</h2>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', fontStyle: 'italic', color: c.sepia, margin: '0 0 0.35rem' }}>We sent a sign-in link to</p>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: c.burgundy, margin: '0 0 1.75rem' }}>{email}</p>
            <div style={{ background: 'rgba(27,58,107,0.04)', border: '1px solid rgba(27,58,107,0.12)', borderRadius: '6px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.sepia, margin: 0, lineHeight: 1.6 }}>
                Click the <strong style={{ color: c.navy }}>"Sign in"</strong> button in the email.
              </p>
            </div>
            <button onClick={() => setSent(false)} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: c.sepia, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>

      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>💘</div>
        <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 700, color: c.navy, margin: '0 0 0.3rem', letterSpacing: '0.02em' }}>Soul Mate</h1>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold, margin: 0 }}>✦ Find Your Forever ✦</p>
      </div>

      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: `1px solid ${c.border}`, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '1.8rem 2rem 1.4rem', borderBottom: `1px solid ${c.border}`, textAlign: 'center', background: c.cream }}>
          <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>Welcome Back</h2>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.sepia, margin: 0, fontStyle: 'italic' }}>Sign in to continue your journey</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${c.border}` }}>
          {(['magic', 'password'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: 'none', borderBottom: mode === m ? `2px solid ${c.burgundy}` : '2px solid transparent', color: mode === m ? c.burgundy : c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
              {m === 'magic' ? '✉  Magic Link' : '🔑  Password'}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.75rem 2rem' }}>
          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: '1.1rem' }}>
              <label style={label}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                style={inp} onFocus={e => (e.target.style.borderColor = '#1b3a6b')} onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
            </div>

            {mode === 'password' && (
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={label}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password"
                  style={inp} onFocus={e => (e.target.style.borderColor = '#1b3a6b')} onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', marginBottom: '1rem', color: '#9e2a2b', fontSize: '0.85rem', fontFamily: '"Cormorant Garamond", serif' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.9rem 1.5rem', background: loading ? c.navyMid : c.navy, color: c.goldLight, border: 'none', borderRadius: '4px', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s', marginTop: '0.25rem' }}>
              {loading ? 'Please wait…' : mode === 'password' ? 'Sign In' : 'Send Magic Link →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1rem', color: c.sepia, margin: 0 }}>
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

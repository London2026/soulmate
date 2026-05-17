'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const c = {
  cream: '#f4f1eb',
  navy: '#0d1f3c',
  navyMid: '#1a3a5c',
  burgundy: '#1b3a6b',
  gold: '#8b6914',
  goldLight: '#c9a84c',
  sepia: '#5a6e82',
  textMid: '#2c4a6e',
  border: 'rgba(13,31,60,0.15)',
}

export default function SignupPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    try {
      if (tab === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, data: { full_name: name.trim() } },
        })
        if (error) throw error
        router.push(`/auth/verify?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&type=signup`)
      } else {
        const formatted = phone.startsWith('+') ? phone : `+${phone}`
        const { error } = await supabase.auth.signInWithOtp({
          phone: formatted,
          options: { data: { full_name: name.trim() } },
        })
        if (error) throw error
        router.push(`/auth/verify?phone=${encodeURIComponent(formatted)}&name=${encodeURIComponent(name)}&type=signup`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>💘</div>
        <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 700, color: c.navy, margin: '0 0 0.3rem', letterSpacing: '0.02em' }}>
          Soul Mate
        </h1>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold, margin: 0 }}>
          ✦ Find Your Forever ✦
        </p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: `1px solid ${c.border}`, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{ padding: '1.8rem 2rem 1.4rem', borderBottom: `1px solid ${c.border}`, textAlign: 'center', background: c.cream }}>
          <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>
            Begin Your Journey
          </h2>
          <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1rem', color: c.sepia, margin: 0, fontStyle: 'italic' }}>
            Create your profile in minutes
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${c.border}` }}>
          {(['email', 'phone'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: 'none', borderBottom: tab === t ? `2px solid ${c.burgundy}` : '2px solid transparent', color: tab === t ? c.burgundy : c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
              {t === 'email' ? '✉  Email' : '📱  Phone'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <form onSubmit={handleSubmit}>
            <Field label="Full Name">
              <Input type="text" value={name} onChange={setName} placeholder="Your full name" required />
            </Field>

            {tab === 'email' ? (
              <Field label="Email Address">
                <Input type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
              </Field>
            ) : (
              <Field label="Phone Number">
                <Input type="tel" value={phone} onChange={setPhone} placeholder="+44 7700 900000" required />
              </Field>
            )}

            {error && (
              <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', marginBottom: '1rem', color: '#9e2a2b', fontSize: '0.85rem', fontFamily: '"Cormorant Garamond", serif' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.9rem 1.5rem', background: loading ? c.navyMid : c.navy, color: c.goldLight, border: 'none', borderRadius: '4px', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s', marginTop: '0.25rem' }}>
              {loading ? 'Sending…' : 'Send Verification Code →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1rem', color: c.sepia, margin: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: c.burgundy, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2c4a6e', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ type, value, onChange, placeholder, required }: { type: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: '#0d1f3c', fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
      onFocus={(e) => (e.target.style.borderColor = '#1b3a6b')}
      onBlur={(e) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')}
    />
  )
}

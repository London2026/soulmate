'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
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
          options: { shouldCreateUser: false },
        })
        if (error) throw error
        router.push(`/auth/verify?email=${encodeURIComponent(email)}&type=login`)
      } else {
        const formatted = phone.startsWith('+') ? phone : `+${phone}`
        const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
        if (error) throw error
        router.push(`/auth/verify?phone=${encodeURIComponent(formatted)}&type=login`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg === 'Signups not allowed for otp' ? 'No account found. Please sign up first.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--oxford-navy)' }}
    >
      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">💘</div>
          <h1
            className="text-4xl tracking-wide mb-2"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
          >
            Soul Mate
          </h1>
          <p
            className="text-sm italic tracking-widest"
            style={{ color: 'var(--antique-gold)' }}
          >
            Est. for the discerning heart
          </p>
          <div
            className="mx-auto mt-5 h-px w-24"
            style={{ background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-8 py-10"
          style={{
            backgroundColor: 'var(--oxford-navy-mid)',
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <h2
            className="text-2xl text-center mb-1"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
          >
            Welcome Back
          </h2>
          <p className="text-center text-sm mb-8" style={{ color: 'var(--ivory-dim)' }}>
            Sign in to continue your journey
          </p>

          {/* Tab switcher */}
          <div
            className="flex rounded-lg mb-6 p-1"
            style={{ backgroundColor: 'rgba(14,26,53,0.8)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            {(['email', 'phone'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 capitalize"
                style={
                  tab === t
                    ? { backgroundColor: 'var(--antique-gold)', color: 'var(--oxford-navy)' }
                    : { color: 'var(--ivory-dim)' }
                }
              >
                {t === 'email' ? '✉ Email' : '📱 Phone'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {tab === 'email' ? (
              <div>
                <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--oxford-navy)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: 'var(--ivory)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--antique-gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.25)')}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+44 7700 900000"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--oxford-navy)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: 'var(--ivory)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--antique-gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.25)')}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-center rounded-lg px-3 py-2" style={{ color: '#F87171', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold tracking-wider transition-all duration-200 disabled:opacity-60"
              style={{
                background: loading ? 'var(--antique-gold-dark)' : 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
                color: 'var(--oxford-navy)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(201,168,76,0.3)',
              }}
            >
              {loading ? 'Sending…' : 'Send One-Time Code'}
            </button>
          </form>

          <div
            className="my-6 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)' }}
          />

          <p className="text-center text-sm" style={{ color: 'var(--ivory-dim)' }}>
            New to Soul Mate?{' '}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: 'var(--antique-gold)' }}
            >
              Create your profile
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'rgba(189,181,166,0.4)' }}>
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, ClipboardEvent, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  email?: string
  phone?: string
  name?: string
  type: string
}

export default function VerifyForm({ email, phone, name, type }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const destination = email ?? phone ?? ''
  const masked = email
    ? email.replace(/(.{2}).*(@.*)/, '$1•••$2')
    : phone
    ? phone.replace(/(\+\d{2})\d+(\d{4})/, '$1•••••$2')
    : ''

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) handleVerify(next.join(''))
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === 6) handleVerify(pasted)
  }

  async function handleVerify(code: string) {
    setLoading(true)
    setError('')
    const supabase = createClient()

    try {
      let result
      if (email) {
        result = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
      } else if (phone) {
        result = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
      } else {
        throw new Error('No contact method provided')
      }

      if (result.error) throw result.error
      router.push(type === 'signup' ? '/onboarding' : '/discover')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setDigits(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    const supabase = createClient()
    if (email) {
      await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: type === 'signup' } })
    } else if (phone) {
      await supabase.auth.signInWithOtp({ phone })
    }
    setResent(true)
    setDigits(Array(6).fill(''))
    inputRefs.current[0]?.focus()
    setTimeout(() => setResent(false), 4000)
  }

  const boxStyle = (filled: boolean) => ({
    backgroundColor: 'var(--oxford-navy)',
    border: `1px solid ${filled ? 'var(--antique-gold)' : 'rgba(201,168,76,0.25)'}`,
    color: 'var(--ivory)',
    transition: 'border-color 0.2s',
  })

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--oxford-navy)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <div className="text-4xl mb-3">💘</div>
            <h1
              className="text-4xl tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
            >
              Soul Mate
            </h1>
          </Link>
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
          {/* Check mark icon */}
          <div
            className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            ✉️
          </div>

          <h2
            className="text-2xl text-center mb-2"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--ivory)' }}
          >
            Check Your{' '}
            {email ? 'Inbox' : 'Messages'}
          </h2>

          <p className="text-center text-sm mb-2" style={{ color: 'var(--ivory-dim)' }}>
            We sent a 6-digit code to
          </p>
          <p
            className="text-center text-sm font-medium mb-8"
            style={{ color: 'var(--antique-gold)' }}
          >
            {masked || destination}
          </p>

          {/* OTP Boxes */}
          <div className="flex gap-3 justify-center mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-11 h-14 text-center text-xl font-semibold rounded-lg outline-none"
                style={boxStyle(!!digit)}
                onFocus={(e) => (e.target.style.borderColor = 'var(--antique-gold)')}
                onBlur={(e) => (e.target.style.borderColor = digit ? 'var(--antique-gold)' : 'rgba(201,168,76,0.25)')}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-center rounded-lg px-3 py-2 mb-4" style={{ color: '#F87171', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </p>
          )}

          {resent && (
            <p className="text-sm text-center mb-4" style={{ color: 'var(--antique-gold)' }}>
              ✓ A new code has been sent
            </p>
          )}

          {loading && (
            <p className="text-sm text-center mb-4" style={{ color: 'var(--ivory-dim)' }}>
              Verifying…
            </p>
          )}

          <div
            className="my-6 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)' }}
          />

          <p className="text-center text-sm" style={{ color: 'var(--ivory-dim)' }}>
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              className="font-medium transition-colors"
              style={{ color: 'var(--antique-gold)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Resend code
            </button>
          </p>

          <p className="text-center text-sm mt-3" style={{ color: 'var(--ivory-dim)' }}>
            <Link href={type === 'signup' ? '/signup' : '/login'} style={{ color: 'var(--ivory-dim)' }}>
              ← Go back
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

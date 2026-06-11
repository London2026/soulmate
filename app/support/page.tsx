'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

const c = {
  bg: '#07111f',
  navy: '#0d1f3c',
  gold: '#8b6914',
  goldLight: '#c9a84c',
  sepia: '#5a6e82',
  ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6',
  border: 'rgba(201,168,76,0.18)',
  rose: '#9e2a2b',
}

const SUBJECTS = [
  'I cannot log in to my account',
  'Issue with my profile or photos',
  'Problem with a video meeting',
  'Billing or subscription query',
  'I want to cancel my subscription',
  'I found an inappropriate profile',
  'ID verification question',
  'Technical issue',
  'Other',
]

const inp = {
  width: '100%',
  padding: '0.85rem 1rem',
  border: '1px solid rgba(201,168,76,0.2)',
  background: 'rgba(26,58,92,0.25)',
  color: '#f5f0e6',
  fontSize: '1rem',
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  outline: 'none',
  borderRadius: '6px',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
}

const label = {
  display: 'block',
  fontFamily: 'Raleway, sans-serif',
  fontSize: '0.72rem',
  fontWeight: 600 as const,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: '#5a6e82',
  marginBottom: '0.5rem',
}

export default function SupportPage() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      const u = session.user
      setEmail(u.email ?? '')
      supabase.from('profiles').select('full_name').eq('id', u.id).maybeSingle().then(({ data }) => {
        if (data?.full_name) setName(data.full_name)
        else if (u.user_metadata?.full_name) setName(u.user_metadata.full_name)
      })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setErrMsg('Please fill in all fields.'); return
    }
    setStatus('sending'); setErrMsg('')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
    } catch {
      setStatus('error')
      setErrMsg('Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0a1a 0%, #07111f 45%, #0f0a18 100%)' }}>
      <style>{`
        .sup-main { max-width: 600px; margin: 0 auto; padding: 5.5rem 1.5rem 5rem; }
        @media (max-width: 600px) { .sup-main { padding: 5rem 1rem 7rem; } }
      `}</style>

      <Navigation />

      <main className="sup-main">

        {/* Heading */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.4rem' }}>
            Help &amp; Support
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.05rem', color: c.sepia, margin: '0 0 1rem' }}>
            We typically respond within 24 hours
          </p>
          <div style={{ height: '1px', background: `linear-gradient(to right, ${c.goldLight}, transparent)` }} />
        </div>

        {status === 'sent' ? (
          /* Success state */
          <div style={{ background: 'rgba(26,58,92,0.3)', border: `1px solid ${c.border}`, borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.5rem', color: c.ivory, margin: '0 0 0.75rem' }}>
              Message sent!
            </h2>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 1.75rem' }}>
              Thank you for getting in touch. We have received your query and will get back to you at <strong style={{ color: c.ivory }}>{email}</strong> within 24 hours.
            </p>
            <Link href="/discover"
              style={{ display: 'inline-block', padding: '0.75rem 2rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px' }}>
              Back to Discover
            </Link>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} style={{ background: 'rgba(26,58,92,0.2)', border: `1px solid ${c.border}`, borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Name */}
            <div>
              <label style={label}>Your Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                style={inp}
                onFocus={e => (e.target.style.borderColor = c.goldLight)}
                onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.2)')}
              />
            </div>

            {/* Email */}
            <div>
              <label style={label}>Your Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="e.g. you@example.com"
                style={inp}
                onFocus={e => (e.target.style.borderColor = c.goldLight)}
                onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.2)')}
              />
            </div>

            {/* Subject */}
            <div>
              <label style={label}>Subject</label>
              <select
                value={subject} onChange={e => setSubject(e.target.value)}
                style={{ ...inp, appearance: 'auto' }}
                onFocus={e => (e.target.style.borderColor = c.goldLight)}
                onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.2)')}
              >
                <option value="">Select a topic…</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Message */}
            <div>
              <label style={label}>Your Message</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Please describe your issue or question in as much detail as possible…"
                rows={6}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.65 }}
                onFocus={e => (e.target.style.borderColor = c.goldLight)}
                onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.2)')}
              />
            </div>

            {errMsg && (
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: '#f87171', margin: 0 }}>
                {errMsg}
              </p>
            )}

            <button
              type="submit" disabled={status === 'sending'}
              style={{ padding: '0.95rem', background: status === 'sending' ? 'rgba(26,58,92,0.5)' : `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', borderRadius: '6px', cursor: status === 'sending' ? 'default' : 'pointer', transition: 'opacity 0.2s' }}>
              {status === 'sending' ? 'Sending…' : 'Send Message →'}
            </button>

          </form>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

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

const SOCIAL_LINKS = [
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@banduraa43?_r=1&_t=ZN-97x3d3icIcg',
    path: 'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/banduraa.banduraa?igsh=MXNlam5tcmhsMDYx&utm_source=qr',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1XocXEcyHM/?mibextid=wwXIfr',
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.098-1.675.309a1.686 1.686 0 0 0-.679.622c-.239.386-.348.885-.348 1.641v1.408h3.99l-.63 3.667h-3.36v7.98H9.101z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@Banduraa-AI',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
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
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: c.sepia, marginTop: '0.85rem' }}>
            Prefer email? Reach us directly at{' '}
            <a href="mailto:support@banduraa.com" style={{ color: c.goldLight }}>support@banduraa.com</a>
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem' }}>
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Banduraa on ${s.label}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', border: `1px solid ${c.border}`, color: c.sepia, transition: 'color 0.2s, border-color 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.color = c.goldLight; e.currentTarget.style.borderColor = c.goldLight }}
                onMouseOut={e => { e.currentTarget.style.color = c.sepia; e.currentTarget.style.borderColor = c.border }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
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

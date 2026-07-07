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

const STYLE = `
  .auth-page { min-height:100dvh; background:#f4f1eb; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 1rem; box-sizing:border-box; position:relative; }
  .auth-home-btn { position:fixed; top:1rem; left:1rem; display:flex; align-items:center; gap:0.4rem; font-family:Raleway,sans-serif; font-size:0.68rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#5a6e82; text-decoration:none; padding:0.5rem 0.85rem; border:1px solid rgba(13,31,60,0.15); border-radius:6px; background:rgba(244,241,235,0.9); backdrop-filter:blur(8px); transition:color 0.2s,border-color 0.2s; z-index:10; }
  .auth-home-btn:hover { color:#1b3a6b; border-color:rgba(13,31,60,0.3); }
  .auth-logo { width:150px; height:150px; object-fit:contain; border-radius:12px; box-shadow:0 6px 30px rgba(13,31,60,0.13); display:block; margin:0 auto 1.5rem; }
  .auth-card { width:100%; max-width:420px; background:#fff; border-radius:10px; box-shadow:0 16px 60px rgba(13,31,60,0.12); border:1px solid rgba(13,31,60,0.15); overflow:hidden; }
  .auth-card-head { padding:1.8rem 2rem 1.4rem; border-bottom:1px solid rgba(13,31,60,0.15); text-align:center; background:#f4f1eb; }
  .auth-card-body { padding:1.75rem 2rem; }
  .auth-lbl { display:block; font-family:Raleway,sans-serif; font-size:0.65rem; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:#2c4a6e; margin-bottom:0.45rem; }
  .auth-inp { width:100%; padding:0.8rem 0.9rem; border:1px solid rgba(13,31,60,0.18); background:rgba(244,241,235,0.4); color:#0d1f3c; font-size:1rem; font-family:"Cormorant Garamond",Georgia,serif; outline:none; border-radius:4px; box-sizing:border-box; transition:border-color 0.2s; }
  .auth-btn { width:100%; padding:0.9rem; border:none; border-radius:4px; font-family:Raleway,sans-serif; font-size:0.7rem; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:background 0.2s; }
  .auth-footer { margin-top:1rem; font-family:Raleway,sans-serif; font-size:0.62rem; letter-spacing:0.1em; color:#5a6e82; text-align:center; }
  @media (max-width:600px) {
    .auth-page { justify-content:flex-start; padding-top:1.25rem; padding-bottom:1.5rem; }
    .auth-logo { width:100px !important; height:100px !important; margin-bottom:1rem; }
    .auth-card-head { padding:1.25rem 1rem 1rem !important; }
    .auth-card-body { padding:1.25rem 1rem !important; }
    .auth-card-head h2 { font-size:1.4rem !important; }
    .auth-btn { font-size:0.75rem !important; padding:0.85rem !important; }
  }
`

export default function DevLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) { setError('Incorrect email or password.'); return }
    router.push('/auth/redirect')
  }

  return (
    <div className="auth-page">
      <style>{STYLE}</style>
      <Link href="/" className="auth-home-btn">← Home</Link>
      <img src="/banduraa-logo.png" alt="Banduraa" className="auth-logo" />
      <div className="auth-card">
        <div className="auth-card-head">
          <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>🔑</div>
          <h2 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>Test Login</h2>
          <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.95rem', fontStyle: 'italic', color: c.sepia, margin: 0 }}>For internal testing only</p>
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="auth-lbl">Email Address</label>
              <input
                type="email" value={email} required placeholder="test@example.com" autoFocus
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="auth-inp"
                onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="auth-lbl">Password</label>
              <input
                type="password" value={password} required placeholder="••••••••"
                onChange={e => { setPassword(e.target.value); setError('') }}
                className="auth-inp"
                onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')}
              />
            </div>
            {error && (
              <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', marginBottom: '1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond",serif', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <button
              type="submit" disabled={loading} className="auth-btn"
              style={{ background: loading ? c.navyMid : c.navy, color: c.goldLight, cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
      <p className="auth-footer">This page is not linked publicly — for owner use only</p>
    </div>
  )
}

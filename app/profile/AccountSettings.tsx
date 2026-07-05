'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription, deleteAccount } from './actions'
import { createClient } from '@/lib/supabase/client'

const c = {
  bg: '#07111f', navy: '#0d1f3c', gold: '#c9a84c',
  sepia: '#5a6e82', ivory: '#f5f0e6', border: 'rgba(201,168,76,0.18)',
  rose: '#9e2a2b', text: '#e8e3d8',
}

function planLabel(plan: string) {
  if (plan === 'standard') return { label: 'Standard', color: '#4ade80', bg: 'rgba(46,125,82,0.2)' }
  if (plan === 'starter')  return { label: 'Starter',  color: c.gold,    bg: 'rgba(201,168,76,0.15)' }
  return                          { label: 'Free',     color: c.sepia,   bg: 'rgba(232,227,216,0.08)' }
}

export default function AccountSettings({ plan, memberId }: { plan: string; memberId: string | null }) {
  const router = useRouter()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [loading, setLoading] = useState<'cancel' | 'delete' | null>(null)
  const [error, setError] = useState('')

  const { label, color, bg } = planLabel(plan)
  const isPaid = plan !== 'free'

  async function handleCancel() {
    setLoading('cancel')
    setError('')
    try {
      await cancelSubscription()
      setShowCancelConfirm(false)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (deleteInput !== 'DELETE') return
    setLoading('delete')
    setError('')
    try {
      await deleteAccount()
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      setError('Something went wrong. Please contact support.')
      setLoading(null)
    }
  }

  return (
    <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '2rem', marginTop: '1rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 1.5rem' }}>
        ✦ Account
      </p>

      {/* Current plan */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`, borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.4rem' }}>Current Plan</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', color: c.ivory }}>{label}</span>
            <span style={{ padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: bg, color }}>{label}</span>
          </div>
          {memberId && <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: c.sepia, margin: '0.3rem 0 0' }}>{memberId}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!isPaid && (
            <a href="/pricing" style={{ display: 'inline-block', padding: '0.55rem 1.25rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, textDecoration: 'none', borderRadius: 4 }}>
              Upgrade →
            </a>
          )}
          {isPaid && (
            <button onClick={() => setShowCancelConfirm(true)}
              style={{ padding: '0.55rem 1.25rem', background: 'transparent', border: `1px solid rgba(158,42,43,0.4)`, color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, borderRadius: 4, cursor: 'pointer' }}>
              Cancel Plan
            </button>
          )}
        </div>
      </div>

      {/* Delete account */}
      <div style={{ background: 'rgba(158,42,43,0.04)', border: '1px solid rgba(158,42,43,0.18)', borderRadius: 8, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#f87171', margin: '0 0 0.25rem' }}>Delete Account</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: c.sepia, margin: 0, lineHeight: 1.5 }}>Permanently removes your profile, photos, and all data. This cannot be undone.</p>
          </div>
          <button onClick={() => { setShowDeleteConfirm(true); setDeleteInput(''); setError('') }}
            style={{ padding: '0.55rem 1.25rem', background: 'rgba(158,42,43,0.15)', border: '1px solid rgba(158,42,43,0.5)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Cancel subscription modal */}
      {showCancelConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d1f3c', border: `1px solid ${c.border}`, borderRadius: 10, padding: '2rem', maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', color: c.ivory, margin: '0 0 0.75rem' }}>Cancel your plan?</h3>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: c.sepia, lineHeight: 1.7, margin: '0 0 0.75rem' }}>
              Your account will be downgraded to the <strong style={{ color: c.ivory }}>Free</strong> plan immediately. You will lose access to photo reveals and video meetings.
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: c.sepia, margin: '0 0 1.5rem' }}>
              You can upgrade again at any time from the <a href="/pricing" style={{ color: c.gold }}>pricing page</a>.
            </p>
            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelConfirm(false)} disabled={!!loading}
                style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: `1px solid ${c.border}`, color: c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, borderRadius: 4, cursor: 'pointer' }}>
                Keep Plan
              </button>
              <button onClick={handleCancel} disabled={loading === 'cancel'}
                style={{ padding: '0.6rem 1.25rem', background: 'rgba(158,42,43,0.2)', border: '1px solid rgba(158,42,43,0.5)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: 4, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading === 'cancel' ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d1f3c', border: '1px solid rgba(158,42,43,0.4)', borderRadius: 10, padding: '2rem', maxWidth: 440, width: '100%' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', color: '#f87171', margin: '0 0 0.75rem' }}>Delete your account?</h3>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: c.sepia, lineHeight: 1.7, margin: '0 0 1.25rem' }}>
              This will permanently delete your profile, photos, voice intro, meeting history, and all associated data. <strong style={{ color: c.ivory }}>This cannot be undone.</strong>
            </p>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: c.sepia, margin: '0 0 0.5rem' }}>
              Type <strong style={{ color: '#f87171' }}>DELETE</strong> to confirm
            </p>
            <input
              type="text" value={deleteInput}
              onChange={e => { setDeleteInput(e.target.value); setError('') }}
              placeholder="DELETE"
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${deleteInput === 'DELETE' ? 'rgba(158,42,43,0.7)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 4, color: c.ivory, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.15em', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem' }}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={!!loading}
                style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: `1px solid ${c.border}`, color: c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, borderRadius: 4, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteInput !== 'DELETE' || loading === 'delete'}
                style={{ padding: '0.6rem 1.25rem', background: deleteInput === 'DELETE' ? 'rgba(158,42,43,0.25)' : 'rgba(158,42,43,0.08)', border: '1px solid rgba(158,42,43,0.5)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: 4, cursor: deleteInput === 'DELETE' && !loading ? 'pointer' : 'default', opacity: deleteInput === 'DELETE' && !loading ? 1 : 0.5 }}>
                {loading === 'delete' ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MeetingStats {
  requested: number
  accepted: number
  declined: number
  waiting: number
}

interface PlanUsage {
  likesUsed: number
  likeLimit: number
  revealsUsed: number
  revealLimit: number | null // null = unlimited
  meetingsUsed: number
  meetingLimit: number
  trialDaysLeft: number | null // null = not on free trial
  trialExpired: boolean
}

interface AuthUser {
  id: string
  name: string
  plan: string
  stats: MeetingStats
  likeStats: { sent: number; mutual: number }
  bookmarks: number
  usage: PlanUsage
}

const PLAN_LIMITS: Record<string, number> = { free: 2, starter: 4, standard: 8 }
const LIKE_LIMITS: Record<string, number> = { free: 5, starter: 10, standard: 15 }
const FREE_REVEAL_LIMIT = 5

const c = {
  nav: 'rgba(7,17,31,0.96)',
  border: 'rgba(201,168,76,0.12)',
  ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6',
  gold: '#c9a84c',
  navy: '#0d1f3c',
  sepia: '#5a6e82',
}

const WARN_MS   = 29 * 60 * 1000  // show warning at 29 min
const LOGOUT_MS = 30 * 60 * 1000  // auto-logout at 30 min

export default function Navigation() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [open, setOpen] = useState(false)
  const [warning, setWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const dropRef    = useRef<HTMLDivElement>(null)
  const warnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function loadUser(userId: string, email?: string, fullName?: string) {
      const monthStart = new Date()
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

      const [
        profileRes, meetingsRes, likesRes, likedMeRes, shortlistRes,
        meetingsThisMonthRes, extraPurchasedRes, likesThisMonthRes, revealsThisMonthRes,
      ] = await Promise.all([
        supabase.from('profiles').select('full_name, plan, created_at').eq('id', userId).maybeSingle(),
        supabase.from('video_meetings')
          .select('status, requester_id')
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
        supabase.from('profile_likes').select('liked_id').eq('liker_id', userId),
        supabase.from('profile_likes').select('liker_id').eq('liked_id', userId),
        supabase.from('shortlist').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('video_meetings').select('*', { count: 'exact', head: true })
          .eq('requester_id', userId).gte('created_at', monthStart.toISOString()),
        supabase.from('extra_meeting_purchases').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).gte('created_at', monthStart.toISOString()),
        supabase.from('profile_likes').select('*', { count: 'exact', head: true })
          .eq('liker_id', userId).gte('created_at', monthStart.toISOString()),
        supabase.from('photo_reveals').select('*', { count: 'exact', head: true })
          .eq('viewer_id', userId).gte('created_at', monthStart.toISOString()),
      ])

      const profile  = profileRes.data
      const meetings = meetingsRes.data ?? []
      const plan     = profile?.plan || 'free'

      const myRequests = meetings.filter(m => m.requester_id === userId)
      const stats: MeetingStats = {
        requested: myRequests.length,
        accepted:  meetings.filter(m => m.status === 'accepted').length,
        declined:  meetings.filter(m => m.status === 'declined').length,
        waiting:   myRequests.filter(m => m.status === 'pending').length,
      }

      const likedByMe   = new Set((likesRes.data ?? []).map(r => r.liked_id as string))
      const likedMe     = new Set((likedMeRes.data ?? []).map(r => r.liker_id as string))
      const mutualCount = [...likedByMe].filter(id => likedMe.has(id)).length

      const createdAt = profile?.created_at as string | null | undefined
      const daysSinceCreation = createdAt
        ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
        : 0
      const trialDaysLeft = plan === 'free' ? Math.max(0, 30 - daysSinceCreation) : null
      const trialExpired  = plan === 'free' && daysSinceCreation > 30

      const usage: PlanUsage = {
        likesUsed:    likesThisMonthRes.count ?? 0,
        likeLimit:    LIKE_LIMITS[plan] ?? 5,
        revealsUsed:  revealsThisMonthRes.count ?? 0,
        revealLimit:  plan === 'free' ? FREE_REVEAL_LIMIT : null,
        meetingsUsed: meetingsThisMonthRes.count ?? 0,
        meetingLimit: (PLAN_LIMITS[plan] ?? 2) + (extraPurchasedRes.count ?? 0),
        trialDaysLeft,
        trialExpired,
      }

      setUser({
        id: userId,
        name: profile?.full_name || fullName || email?.split('@')[0] || 'Member',
        plan,
        stats,
        likeStats: { sent: likedByMe.size, mutual: mutualCount },
        bookmarks: shortlistRes.count ?? 0,
        usage,
      })
    }

    // 1. Immediate check via getSession (reads local cookies — no server round-trip)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email, session.user.user_metadata?.full_name)
      }
    })

    // 2. Subscribe for future changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email, session.user.user_metadata?.full_name)
      } else {
        setUser(null)
      }
    })

    // Close dropdown on outside click
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setWarning(false)
    router.push('/')
  }

  // ── Inactivity timer ────────────────────────────────────────────────────────
  function clearTimers() {
    if (warnTimer.current)  clearTimeout(warnTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
    if (countdownInterval.current) clearInterval(countdownInterval.current)
  }

  function resetInactivity() {
    clearTimers()
    setWarning(false)
    setCountdown(60)

    warnTimer.current = setTimeout(() => {
      setWarning(true)
      setCountdown(60)
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownInterval.current!); return 0 }
          return prev - 1
        })
      }, 1000)
    }, WARN_MS)

    logoutTimer.current = setTimeout(() => {
      handleSignOut()
    }, LOGOUT_MS)
  }

  useEffect(() => {
    if (!user) { clearTimers(); return }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const handler = () => resetInactivity()

    resetInactivity()
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))

    return () => {
      clearTimers()
      events.forEach(e => window.removeEventListener(e, handler))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const planLabel = user?.plan === 'standard' ? 'Standard' : user?.plan === 'starter' ? 'Starter' : 'Free'

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? ''

  return (
    <>
    <style>{`
      @media (max-width: 640px) {
        .dnav-text-links { display: none; }
        .dnav-username { display: none; }
      }
    `}</style>
    {/* Inactivity warning modal */}
    {warning && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: '#0d1f3c', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '14px', padding: '2rem 2rem 1.75rem', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏱</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: 600, color: '#f5f0e6', margin: '0 0 0.6rem' }}>
            Still there?
          </h2>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: '#bdb5a6', lineHeight: 1.65, margin: '0 0 0.5rem' }}>
            You have been inactive for 29 minutes.
          </p>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: '#f87171', fontWeight: 600, margin: '0 0 1.5rem' }}>
            You will be logged out automatically in <strong style={{ fontSize: '1.1rem' }}>{countdown}s</strong>
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={resetInactivity}
              style={{ flex: 1, padding: '0.85rem', background: 'linear-gradient(135deg, #e8c876, #c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Stay Logged In
            </button>
            <button onClick={handleSignOut}
              style={{ flex: 1, padding: '0.85rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', cursor: 'pointer' }}>
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    )}
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: c.nav, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${c.border}` }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <img src="/banduraa-logo.png" alt="Banduraa" style={{ height: '52px', width: '52px', objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
        </Link>

        {user ? (
          /* ── Logged-in nav ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/discover" className="dnav-text-links" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Discover</Link>
            <Link href="/profile"  className="dnav-text-links" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>My Profile</Link>
            <Link href="/blog"     className="dnav-text-links" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Blog</Link>

            {/* User dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, borderRadius: '24px', padding: '0.3rem 0.75rem 0.3rem 0.3rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                {/* Avatar */}
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3358, #253f6a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", serif', fontSize: '0.7rem', fontWeight: 700, color: c.gold, flexShrink: 0 }}>
                  {initials}
                </div>
                <span className="dnav-username" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivory }}>
                  {user.name.split(' ')[0]}
                </span>
                <span style={{ color: c.ivoryDim, fontSize: '0.65rem' }}>▾</span>
              </button>

              {/* Dropdown panel */}
              {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 'min(310px, calc(100vw - 1.5rem))', background: '#0d1f3c', border: `1px solid ${c.border}`, borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflowX: 'hidden', overflowY: 'auto', maxHeight: 'calc(100dvh - 80px)', zIndex: 200 }}>

                  {/* Profile header */}
                  <div style={{ padding: '1.25rem 1.4rem', borderBottom: `1px solid ${c.border}`, background: 'rgba(30,51,88,0.5)' }}>
                    <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.35rem' }}>{user.name}</p>
                    <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.22rem 0.7rem', background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.3)`, color: c.gold, borderRadius: '20px' }}>
                      {planLabel} Plan
                    </span>
                  </div>

                  {/* Plan usage */}
                  <div style={{ padding: '1rem 1.4rem', borderBottom: `1px solid ${c.border}` }}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.75rem' }}>Plan Usage</p>
                    {[
                      { icon: '❤️', label: user.plan === 'free' ? 'Trial Likes' : 'Likes', used: user.usage.likesUsed, limit: user.usage.likeLimit },
                      { icon: '📸', label: user.plan === 'free' ? 'Trial Photo Reveals' : 'Photo Reveals', used: user.usage.revealsUsed, limit: user.usage.revealLimit },
                      { icon: '🎥', label: user.plan === 'free' ? 'Trial Meetings' : 'Meetings', used: user.usage.meetingsUsed, limit: user.usage.meetingLimit },
                    ].map(row => {
                      const remaining = row.limit === null ? null : Math.max(0, row.limit - row.used)
                      const pct = row.limit ? remaining! / row.limit : 1
                      const col = row.limit === null ? '#4ade80' : pct > 0.5 ? '#f9a8d4' : pct > 0 ? '#fbbf24' : '#f87171'
                      return (
                        <div key={row.label} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.15rem 0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, whiteSpace: 'nowrap' }}>{row.icon} {row.label}</span>
                          {row.limit === null ? (
                            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 600, color: col, marginLeft: 'auto', whiteSpace: 'nowrap' }}>Unlimited</span>
                          ) : (row.label.includes('Meetings')) ? (
                            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, color: col, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{remaining} remaining</span>
                          ) : (
                            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                              <span style={{ color: col }}>{row.used}</span>
                              <span style={{ color: c.ivoryDim }}> / {row.limit}</span>
                            </span>
                          )}
                        </div>
                      )
                    })}

                    {user.usage.trialExpired && (
                      <div style={{ marginTop: '0.6rem', padding: '0.65rem 0.9rem', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '8px' }}>
                        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: '#fca5a5' }}>
                          ⌛ FREE TRIAL ENDED —{' '}
                          <Link href="/pricing" onClick={() => setOpen(false)} style={{ color: '#fca5a5', textDecoration: 'underline' }}>UPGRADE NOW</Link>
                        </span>
                      </div>
                    )}
                    {user.usage.trialDaysLeft !== null && !user.usage.trialExpired && (() => {
                      const days = user.usage.trialDaysLeft!
                      const dayColor = days > 10 ? '#4ade80' : days > 5 ? '#fbbf24' : '#f87171'
                      return (
                        <div style={{ marginTop: '0.6rem', padding: '0.65rem 0.9rem', background: 'rgba(74,222,128,0.08)', border: `1px solid ${dayColor}55`, borderRadius: '8px' }}>
                          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: dayColor }}>
                            ⏳ {days} DAY{days !== 1 ? 'S' : ''} LEFT IN FREE TRIAL
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Meeting stats */}
                  <div style={{ padding: '1rem 1.4rem', borderBottom: `1px solid ${c.border}` }}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.75rem' }}>Meeting Activity</p>
                    {[
                      { label: 'Requests Sent',         value: user.stats.requested, color: '#93c5fd' },
                      { label: 'Accepted',              value: user.stats.accepted,  color: '#4ade80' },
                      { label: 'Declined',              value: user.stats.declined,  color: '#f87171' },
                      { label: 'Awaiting Confirmation', value: user.stats.waiting,   color: c.gold },
                    ].map(stat => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim }}>{stat.label}</span>
                        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, color: stat.color, minWidth: '24px', textAlign: 'right' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connections stats */}
                  <div style={{ padding: '1rem 1.4rem', borderBottom: `1px solid ${c.border}` }}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.75rem' }}>Connections</p>
                    {[
                      { label: 'Profiles Liked',  value: user.likeStats.sent,   color: '#f9a8d4' },
                      { label: 'Mutual Likes',    value: user.likeStats.mutual, color: '#4ade80' },
                      { label: 'Profiles Saved',  value: user.bookmarks,        color: c.gold    },
                    ].map(stat => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim }}>{stat.label}</span>
                        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, color: stat.color, minWidth: '24px', textAlign: 'right' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '0.85rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <Link href="/profile" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      👤 My Profile
                    </Link>
                    <Link href="/pricing" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⭐ Upgrade Plan
                    </Link>
                    <Link href="/blog" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📰 Blog
                    </Link>
                    <Link href="/support" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ❓ Help &amp; Support
                    </Link>
                    <div style={{ height: '1px', background: `1px solid ${c.border}`, margin: '0.25rem 0', opacity: 0.3 }} />
                    <button onClick={handleSignOut}
                      style={{ textAlign: 'left', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      → Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Guest nav ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Discover</Link>
            <Link href="/pricing"  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Pricing</Link>
            <Link href="/blog"     className="dnav-text-links" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Blog</Link>
            <Link href="/login"    style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Sign In</Link>
            <Link href="/signup"
              style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', textDecoration: 'none' }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
    </>
  )
}


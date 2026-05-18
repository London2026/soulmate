'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthUser { name: string; onboarded: boolean; plan: string }

export default function Navigation() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) { setUser(null); return }
        const u = session.user
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_complete, plan')
          .eq('id', u.id)
          .maybeSingle()
        setUser({
          name: profile?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Member',
          onboarded: !!profile?.onboarding_complete,
          plan: profile?.plan || 'free',
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const planLabel = user?.plan === 'standard' ? 'Standard' : user?.plan === 'starter' ? 'Starter' : 'Free'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(7,17,31,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(201,168,76,0.12)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <img src="/soulmate-logo.png" alt="Soul Mate" style={{ height: '38px', width: '38px', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.3rem', fontWeight: 700, color: '#f5f0e6', letterSpacing: '0.02em' }}>
            Soul Mate
          </span>
        </Link>

        {/* Right side */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* App nav links */}
            <Link href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: '#bdb5a6', textDecoration: 'none', letterSpacing: '0.06em' }}>Discover</Link>
            <Link href="/profile"  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: '#bdb5a6', textDecoration: 'none', letterSpacing: '0.06em' }}>My Profile</Link>
            {/* Divider */}
            <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
            {/* Name */}
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#bdb5a6' }}>
              {user.name}
            </span>
            {/* Plan badge */}
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.2rem 0.65rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', borderRadius: '20px' }}>
              {planLabel}
            </span>
            {/* Sign Out */}
            <button onClick={handleSignOut}
              style={{ padding: '0.45rem 0.9rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: '#bdb5a6', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#bdb5a6', textDecoration: 'none', letterSpacing: '0.06em' }}>Discover</Link>
            <Link href="/pricing"  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#bdb5a6', textDecoration: 'none', letterSpacing: '0.06em' }}>Pricing</Link>
            <Link href="/login"    style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#bdb5a6', textDecoration: 'none', letterSpacing: '0.06em' }}>Sign In</Link>
            <Link href="/signup"
              style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', textDecoration: 'none' }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

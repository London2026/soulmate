'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthUser {
  name: string
  onboarded: boolean
}

export default function Navigation() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { setUser(null); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, onboarding_complete')
        .eq('id', u.id)
        .maybeSingle()

      setUser({
        name: profile?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Member',
        onboarded: !!profile?.onboarding_complete,
      })
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser())
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 glass border-b border-white/5 safe-top"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <span className="text-2xl">💘</span>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)' }}>
            Soul Mate
          </span>
        </Link>

        {user ? (
          /* Authenticated nav */
          <div className="flex items-center gap-3">
            {/* Name */}
            <span className="hidden sm:block text-sm" style={{ color: 'var(--ivory-dim)', fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
              {user.name}
            </span>

            {/* Plan badge */}
            <span
              className="hidden sm:block text-xs px-2.5 py-0.5 rounded-full font-semibold tracking-wider"
              style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--antique-gold)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              Free Plan
            </span>

            {/* Profile / Create Profile */}
            <Link
              href={user.onboarded ? '/profile' : '/onboarding'}
              className="px-4 py-2 text-sm font-semibold rounded-full transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--antique-gold-light, #e8c876), var(--antique-gold, #c9a84c))',
                color: 'var(--oxford-navy, #0e1a35)',
                fontSize: '0.75rem',
              }}
            >
              {user.onboarded ? 'My Profile' : 'Create Profile'}
            </Link>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="hidden sm:block text-xs font-medium px-3 py-1.5 rounded-full border transition-all hover:border-white/40"
              style={{ color: 'var(--ivory-dim)', borderColor: 'rgba(255,255,255,0.15)', background: 'transparent', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Guest nav */
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <Link href="/discover" className="hover:text-white transition-colors">Discover</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 text-sm font-bold text-white rounded-full hover:shadow-lg transition"
              style={{ background: 'linear-gradient(to right, #ec4899, #8b5cf6)' }}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  )
}

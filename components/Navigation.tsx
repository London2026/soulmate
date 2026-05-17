'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Navigation() {
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
          <span className="text-xl font-bold tracking-tight">Soul Mate</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/demo" className="hover:text-white transition-colors">Explore Demo</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-white transition-colors">Safety</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/demo" 
            className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Preview
          </Link>
          <Link 
            href="/onboarding" 
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-violet-500 rounded-full hover:shadow-lg hover:shadow-pink-500/25 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/discover', icon: '💘', label: 'Match' },
  { href: '/profile', icon: '👤', label: 'Profile' },
  { href: '/pricing', icon: '💳', label: 'Pricing' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-bottom"
    >
      <div className="flex justify-around items-center py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive 
                  ? 'text-pink-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <motion.span 
                whileTap={{ scale: 0.9 }}
                className="text-xl"
              >
                {item.icon}
              </motion.span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
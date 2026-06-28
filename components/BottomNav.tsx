'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: '/discover',
    label: 'Discover',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(7,17,31,0.97)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(201,168,76,0.18)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
      padding: '0',
      height: '62px',
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.28rem',
            textDecoration: 'none',
            position: 'relative',
            color: isActive ? '#c9a84c' : '#4a5a6e',
            transition: 'color 0.2s',
          }}>
            {/* Active top bar */}
            {isActive && (
              <span style={{
                position: 'absolute', top: 0, left: '20%', right: '20%',
                height: '2px',
                background: 'linear-gradient(to right, #e8c876, #c9a84c)',
                borderRadius: '0 0 2px 2px',
              }} />
            )}

            {/* Icon with subtle glow when active */}
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
              transition: 'background 0.2s',
            }}>
              {item.icon}
            </span>

            <span style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '0.58rem',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In — Banduraa',
  description: 'Sign in to your Banduraa account to continue your journey.',
  robots: { index: false },
  alternates: { canonical: 'https://banduraa.com/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

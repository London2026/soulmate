import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — Join Banduraa',
  description: 'Create your free Banduraa account and start connecting with verified members through voice introductions and anonymous photos.',
  openGraph: {
    title: 'Sign Up — Join Banduraa',
    description: 'Create your free account and find your forever.',
    url: 'https://banduraa.com/signup',
  },
  alternates: { canonical: 'https://banduraa.com/signup' },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

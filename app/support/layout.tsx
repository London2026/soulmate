import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support — Banduraa',
  description: 'Get help with your Banduraa account. Contact our support team for any questions about your profile, subscription, or meetings.',
  alternates: { canonical: 'https://banduraa.com/support' },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

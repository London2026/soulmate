import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Simple, Honest Plans',
  description: 'Start free and upgrade when you are ready. Banduraa starter from $6/month — reveal photos, request video meetings, and find your match.',
  openGraph: {
    title: 'Banduraa Pricing — Simple, Honest Plans',
    description: 'Start free and upgrade when you are ready. Plans from $6/month.',
    url: 'https://banduraa.com/pricing',
  },
  alternates: { canonical: 'https://banduraa.com/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

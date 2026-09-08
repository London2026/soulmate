import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { MotionProvider } from '@/components/motion'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://banduraa.com'),
  title: {
    default: 'Banduraa — Voice-First Matrimony',
    template: '%s | Banduraa',
  },
  description: 'The privacy-first matrimony platform where personality comes before photos. Share your voice, connect authentically, and find your forever.',
  keywords: ['matrimony', 'matrimony site', 'online matrimony', 'matrimony UK', 'matrimony USA', 'marriage UK', 'marriage USA', 'voice-first matrimony', 'privacy matrimony', 'find a life partner', 'video meeting matrimony', 'verified matrimony profiles'],
  authors: [{ name: 'Banduraa', url: 'https://banduraa.com' }],
  creator: 'Banduraa',
  openGraph: {
    type: 'website',
    siteName: 'Banduraa',
    title: 'Banduraa — Voice-First Matrimony',
    description: 'The privacy-first matrimony platform where personality comes before photos. Share your voice, connect authentically, and find your forever.',
    url: 'https://banduraa.com',
    images: [{ url: '/banduraa-hero-bg.png', width: 1200, height: 630, alt: 'Banduraa — Find Your Forever' }],
    locale: 'en_GB',
    alternateLocale: ['en_US'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Banduraa — Voice-First Matrimony',
    description: 'The privacy-first matrimony platform where personality comes before photos.',
    images: ['/banduraa-hero-bg.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/banduraa-logo.png',
    apple: '/banduraa-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${inter.className} antialiased bg-slate-950 text-white min-h-screen`}>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
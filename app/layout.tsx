import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'

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
  keywords: ['matrimony', 'Muslim matrimony', 'South Asian matrimony', 'Islamic marriage', 'halal matchmaking', 'voice-first matrimony', 'privacy matrimony', 'nikah', 'rishta', 'marriage UK'],
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
        {children}
      </body>
    </html>
  )
}
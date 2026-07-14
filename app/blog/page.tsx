import Link from 'next/link'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { getAllPosts } from '@/content/blog'

const c = {
  navy: '#0d1f3c', navyMid: '#152240',
  gold: '#8b6914', goldLight: '#c9a84c', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', sepia: '#5a6e82', border: 'rgba(201,168,76,0.18)',
}

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Guidance on voice-first matching, profile verification, and meeting safely — straight from the team building Banduraa.',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <Navigation />

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '7rem 1.25rem 6rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <span style={{ display: 'inline-block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.3rem 1rem', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, color: c.goldLight, borderRadius: '20px', marginBottom: '1.25rem' }}>
            Blog
          </span>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 600, color: c.ivory, margin: '0 0 0.75rem', lineHeight: 1.15 }}>
            Learn how Banduraa works
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: c.ivoryDim, maxWidth: '58ch', lineHeight: 1.6, margin: 0 }}>
            Straight answers on voice-first matching, profile verification, and how to move from a first like to meeting in person — safely, and at your own pace.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <article style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '12px', padding: 'clamp(1.25rem, 4vw, 1.75rem)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem 0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight }}>
                    {post.tag}
                  </span>
                  <span style={{ color: c.sepia, fontSize: '0.7rem' }}>·</span>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: c.sepia }}>
                    {formatDate(post.date)} · {post.readingMinutes} min read
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>
                  {post.title}
                </h2>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.6, margin: 0 }}>
                  {post.description}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

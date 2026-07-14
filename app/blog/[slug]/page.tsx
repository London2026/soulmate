import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { getAllPosts, getPostBySlug } from '@/content/blog'
import type { BlogBlock } from '@/content/blog'

const c = {
  navy: '#0d1f3c', navyMid: '#152240',
  gold: '#8b6914', goldLight: '#c9a84c', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', sepia: '#5a6e82', border: 'rgba(201,168,76,0.18)',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article' },
  }
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '2rem 0 0.9rem' }}>
          {block.text}
        </h2>
      )
    case 'list':
      return (
        <ul style={{ margin: '0 0 1.3rem', padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.6 }}>
              {item}
            </li>
          ))}
        </ul>
      )
    case 'quote':
      return (
        <blockquote style={{ margin: '1.5rem 0', padding: '1rem 1.4rem', borderLeft: `3px solid ${c.goldLight}`, background: 'rgba(201,168,76,0.06)', borderRadius: '0 8px 8px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.2rem', color: c.ivory, margin: 0, lineHeight: 1.6 }}>
            “{block.text}”
          </p>
        </blockquote>
      )
    case 'p':
    default:
      return (
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.75, margin: '0 0 1.3rem' }}>
          {block.text}
        </p>
      )
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <Navigation />

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '7rem 1.25rem 6rem' }}>
        <Link href="/blog" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: c.sepia, textDecoration: 'none' }}>
          ← Back to Blog
        </Link>

        <div style={{ margin: '1.5rem 0 2.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem 0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight }}>
              {post.tag}
            </span>
            <span style={{ color: c.sepia, fontSize: '0.7rem' }}>·</span>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: c.sepia }}>
              {formatDate(post.date)} · {post.readingMinutes} min read
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 600, color: c.ivory, margin: 0, lineHeight: 1.2 }}>
            {post.title}
          </h1>
        </div>

        <article>
          {post.body.map((block, i) => <Block key={i} block={block} />)}
        </article>

        <div style={{ marginTop: '2.5rem', padding: 'clamp(1.25rem, 4vw, 1.75rem)', background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.6rem' }}>
            Ready to try it yourself?
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.02rem', color: c.ivoryDim, margin: '0 0 1.25rem' }}>
            5 likes, 5 photo reveals, and 2 video meetings — free for 30 days, no credit card required.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '0.85rem 2rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px' }}>
            Start Your Free Trial
          </Link>
        </div>
      </main>
    </div>
  )
}

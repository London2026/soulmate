import { MetadataRoute } from 'next'
import { getAllPosts } from '@/content/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://banduraa.com'
  const now = new Date()

  const posts = getAllPosts().map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }))

  return [
    { url: base,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/signup`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.8 },
    { url: `${base}/blog`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/login`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/support`,     lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    ...posts,
  ]
}

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://banduraa.com'
  const now = new Date()
  return [
    { url: base,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/signup`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.8 },
    { url: `${base}/login`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/support`,     lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/discover', '/profile', '/onboarding', '/api/', '/auth/'],
      },
    ],
    sitemap: 'https://banduraa.com/sitemap.xml',
  }
}

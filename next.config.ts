import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production'

// Next.js injects inline bootstrap scripts and public/index.html has inline
// scripts, so 'unsafe-inline' is required (a nonce would force every page to
// render dynamically and can't cover the static landing page).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://cdn.jsdelivr.net https://*.oppwa.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.oppwa.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.oppwa.com",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.oppwa.com",
  "frame-src https://*.oppwa.com https://www.youtube-nocookie.com https://www.youtube.com",
  "form-action 'self' https://*.oppwa.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  // sharp ships native binaries; without this, Next.js's serverless file
  // tracing can fail to bundle the correct platform binary, causing photo
  // blurring to silently fail in production while working fine locally.
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Serve the original landing page at / without changing the URL
        { source: '/', destination: '/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async redirects() {
    return [
      { source: '/register',      destination: '/signup', permanent: true },
      { source: '/register.html', destination: '/signup', permanent: true },
      { source: '/admin.html',    destination: '/admin',  permanent: true },
      { source: '/index.html',    destination: '/',       permanent: true },
    ]
  },
}

export default nextConfig;

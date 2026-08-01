import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships native binaries; without this, Next.js's serverless file
  // tracing can fail to bundle the correct platform binary, causing photo
  // blurring to silently fail in production while working fine locally.
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
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

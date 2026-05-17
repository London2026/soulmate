import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // Run before app router — serves public/index.html at "/"
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/ai_matching.html', destination: '/ai_matching.html' },
        { source: '/admin.html', destination: '/admin.html' },
      ],
    }
  },
  async redirects() {
    return [
      // Old static register page → new Supabase signup
      { source: '/register', destination: '/signup', permanent: false },
      { source: '/register.html', destination: '/signup', permanent: false },
      // /admin shortcut → static admin page
      { source: '/admin', destination: '/admin.html', permanent: false },
    ]
  },
}

export default nextConfig;

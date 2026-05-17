import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old static register page → Supabase signup
      { source: '/register', destination: '/signup', permanent: false },
      { source: '/register.html', destination: '/signup', permanent: false },
      // /admin shortcut → static admin page
      { source: '/admin', destination: '/admin.html', permanent: false },
    ]
  },
}

export default nextConfig;

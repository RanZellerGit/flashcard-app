/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance & Production Optimizations
  reactStrictMode: true,

  // Headers for caching optimization
  async headers() {
    return [
      {
        // HTML pages: never cache — auth redirects must always be re-evaluated.
        // Caching 302s on mobile (especially Safari) causes a redirect loop
        // where the browser replays the cached /sign-in redirect after login.
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Static JS/CSS/images: cache aggressively (Next.js content-hashes these)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {},
  },

  // Disable static optimization for better compatibility
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
}

module.exports = nextConfig

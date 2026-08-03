import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './i18n/request.ts'
);

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
`;

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next.js walks up
  // the tree, finds a stray lockfile in the user's home directory, and warns
  // about "multiple lockfiles" while inferring the wrong root for file tracing.
  outputFileTracingRoot: __dirname,

  // Performance: enable React strict mode for better debugging
  reactStrictMode: true,

  // Performance: compress responses
  compress: true,

  // Performance: powered-by header removed for security
  poweredByHeader: false,

  images: {
    // No remote image hosts. All assets ship from /public so the prod
    // bundle has zero third-party media dependencies.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Quality presets used across the site (lawyer portraits use 92 for
    // editorial crispness). Required from Next 16 onwards.
    qualities: [75, 85, 90, 92],
  },

  // Performance: enable experimental optimizations
  experimental: {
    optimizeCss: false, // requires critters - leave off unless installed
  },

// Headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()', },
          // HSTS: only meaningful over HTTPS in production. 2 years +
          // includeSubDomains + preload eligible.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);

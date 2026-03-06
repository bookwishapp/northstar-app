import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // CRITICAL: Must be 'standalone' for Railway deployment
  // This ensures Next.js runs as a Node.js server, not serverless
  output: 'standalone',

  // Enable experimental features if needed
  experimental: {
    // Server Actions for admin panel
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Image optimization settings
  images: {
    domains: [
      'northstar-postal.s3.amazonaws.com',
      'fonts.googleapis.com',
    ],
  },

  // Environment variable validation
  env: {
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'development',
  },

  // Disable powered by header for security
  poweredByHeader: false,

  // Strict mode for development
  reactStrictMode: true,
}

export default nextConfig
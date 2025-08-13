import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features for React 19 and Next.js 15
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // TypeScript configuration
  typescript: {
    // Enable type checking during build
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Run ESLint during build
    ignoreDuringBuilds: false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gitlab.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bitbucket.org',
        pathname: '/**',
      },
    ],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/admin/users',
        permanent: true,
      },
    ]
  },

  // Rewrites for API versioning
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output configuration for different deployment targets
  output: 'standalone',

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configurations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Bundle analyzer in development
    if (dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId),
        })
      )
    }

    return config
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Development server configuration
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
}

export default nextConfig
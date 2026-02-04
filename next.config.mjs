/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable standalone output for production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Strict mode for better performance
  reactStrictMode: true,

  // Power by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  
  // Optimize navigation
  onDemandEntries: {
    // Keep pages in memory for faster navigation
    maxInactiveAge: 25 * 1000, // 25 seconds
    pagesBufferLength: 5, // Keep 5 pages in memory
  },

  // Webpack configuration for code splitting
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            // Admin chunk (lazy loaded)
            admin: {
              name: 'admin',
              test: /[\\/]app[\\/]admin[\\/]/,
              chunks: 'all',
              priority: 40,
            },
          },
        },
      }
    }

    return config
  },
}

export default nextConfig

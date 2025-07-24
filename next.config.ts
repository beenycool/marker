import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Configure for Cloudflare Workers
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Optimize for bundle size
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion',
      '@tanstack/react-query',
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Add path aliases
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Optimize bundle size for Workers
    if (!dev && !isServer) {
      // Aggressive tree shaking optimizations
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        concatenateModules: true,
      };

      // Plugin to ignore certain modules
      config.plugins = [
        ...(config.plugins || []),
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /^(sharp|canvas|bufferutil|utf-8-validate|fsevents)$/,
        }),
        // Ignore problematic calendar component
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /react-day-picker/,
          contextRegExp: /@stackframe\/stack-ui/,
        }),
        // Minimize bundle size further
        new (require('webpack').optimize.LimitChunkCountPlugin)({
          maxChunks: 15,
        }),
      ];

      // Reduce bundle size by replacing large dependencies
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use smaller alternatives where possible
        lodash: 'lodash-es',
      };
    }

    return config;
  },
};

export default nextConfig;

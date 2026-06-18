import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  webpack(cfg, { isServer }) {
    if (!isServer) {
      cfg.resolve.fallback = { ...cfg.resolve.fallback, fs: false, zlib: false }
    }
    return cfg
  },
}

export default config

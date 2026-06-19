import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  turbopack: {},
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    proxyClientMaxBodySize: 300 * 1024 * 1024,
  },
}

export default config

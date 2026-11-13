import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,

  // El servidor se enlaza a 0.0.0.0 en Docker; el navegador también accede por este loopback.
  allowedDevOrigins: ['127.0.0.1'],

  /** Reenvía la API al destino interno del build; conserva el servicio Docker por defecto. */
  async rewrites() {
    const apiOrigin = (process.env.API_INTERNAL_URL || 'http://backend:3001').replace(/\/+$/, '');
    return [{
      source: '/api/:path*',
      destination: `${apiOrigin}/api/:path*`,
    }];
  },

  /** Activa polling para cambios de archivos en Docker Desktop cuando se solicita. */
  webpack(config, { dev }) {
    if (dev && process.env.WATCHPACK_POLLING === 'true') {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;

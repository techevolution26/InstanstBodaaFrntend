// next.config.js
module.exports = {
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

    return [
      { source: '/storage/:path*', destination: `${apiBase}/storage/:path*` },
      { source: '/sanctum/:path*', destination: `${apiBase}/sanctum/:path*` },
      { source: '/api/:path*', destination: `${apiBase}/api/:path*` },

      { source: '/login', destination: '/auth/login' },
      { source: '/register', destination: '/auth/register' },
    ];
  },
};

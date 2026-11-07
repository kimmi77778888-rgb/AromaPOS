/** @type {import('next').NextConfig} */
let rawBackend = (process.env.BACKEND_URL || 'http://localhost:8080').trim();
if (rawBackend && !rawBackend.startsWith('http://') && !rawBackend.startsWith('https://')) {
  rawBackend = `https://${rawBackend}`;
}
const BACKEND_URL = rawBackend.replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  // 1. Remove X-Powered-By: Next.js header (hides framework identity from automated vulnerability scanners)
  poweredByHeader: false,
  // 2. Disable browser source maps in production (prevents hackers from viewing original source code in DevTools)
  productionBrowserSourceMaps: false,
  // 3. Strip console logs in production bundles to avoid leaking state/data
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // 4. Hardened Security Headers (Anti-Clickjacking, Anti-MIME Sniffing, XSS filtering)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;


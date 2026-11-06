/** @type {import('next').NextConfig} */
let rawBackend = (process.env.BACKEND_URL || 'http://localhost:8080').trim();
if (rawBackend && !rawBackend.startsWith('http://') && !rawBackend.startsWith('https://')) {
  rawBackend = `https://${rawBackend}`;
}
const BACKEND_URL = rawBackend.replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
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


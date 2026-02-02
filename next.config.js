/** @type {import('next').NextConfig} */

// Backend URL - configurable via environment variable for CI
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Configure rewrites to proxy API requests to backend
  async rewrites() {
    return [
      {
        source: '/upload/:path*',
        destination: `${BACKEND_URL}/upload/:path*`,
      },
      {
        source: '/erpnext/:path*',
        destination: `${BACKEND_URL}/erpnext/:path*`,
      },
    ];
  },
  
  // Configure headers for CORS if needed
  async headers() {
    return [
      {
        source: '/upload/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

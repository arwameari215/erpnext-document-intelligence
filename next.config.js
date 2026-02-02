/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Configure rewrites to proxy API requests to backend
  async rewrites() {
    return [
      {
        source: '/upload/:path*',
        destination: 'http://localhost:8000/upload/:path*',
      },
      {
        source: '/erpnext/:path*',
        destination: 'http://localhost:8000/erpnext/:path*',
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

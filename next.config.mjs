/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow Shopify Admin to embed this app in an iframe
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com https://theridery.com https://www.theridery.com;"
          },
          // Remove X-Frame-Options so CSP takes precedence
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ]
      }
    ];
  }
};

export default nextConfig;

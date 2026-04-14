/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'plus.unsplash.com' },
  { protocol: 'https', hostname: 'randomuser.me' },
  { protocol: 'https', hostname: 'ui-avatars.com' },
  // add this:
  { protocol: 'https', hostname: 'your-account.r2.cloudflarestorage.com' },
  { protocol: 'https', hostname: 'your-bucket.r2.dev' },
],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

module.exports = nextConfig;

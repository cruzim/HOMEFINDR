/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'plus.unsplash.com' },
  { protocol: 'https', hostname: 'randomuser.me' },
  { protocol: 'https', hostname: 'ui-avatars.com' },
  // add this:
  { protocol: 'https', hostname: '5a1ac8c13e14eaa53632513a26afbc60.r2.cloudflarestorage.com' },
  { protocol: 'https', hostname: 'pub-807924a44e4b40d5ba6f93ee145fc31c.r2.dev' },
  // Google profile photos (OAuth)
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
  { protocol: 'https', hostname: 'lh5.googleusercontent.com' },
  { protocol: 'https', hostname: 'lh6.googleusercontent.com' },
],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

module.exports = nextConfig;

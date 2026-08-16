/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Supabase Storage
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;

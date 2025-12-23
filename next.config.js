/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to allow API routes to work
  // API routes require server-side execution and cannot be statically exported
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;

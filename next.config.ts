import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel auto-handles Next.js builds. No standalone output needed. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

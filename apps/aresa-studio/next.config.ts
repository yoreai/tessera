import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Static export removed to support demo mode API routes on Vercel
  // When deploying as standalone app, API routes provide demo data
  // When running with aresa-cli backend, API routes proxy to localhost:3001
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

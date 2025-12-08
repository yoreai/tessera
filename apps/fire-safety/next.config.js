/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode to prevent Leaflet double-initialization
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
  // Moved from experimental in Next.js 16
  typedRoutes: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Compress responses
  compress: true,
  // Reduce bundle size by tree-shaking unused exports
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
      preventFullImport: true,
    },
  },
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},
};

module.exports = nextConfig;

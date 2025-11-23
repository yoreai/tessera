/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.clerk.dev"],
  },
  experimental: {
    typedRoutes: true,
  },
  // Performance optimizations
  swcMinify: true, // Use SWC for minification (faster than Terser)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Remove console.logs in production
  },
  webpack: (config, { isServer, dev }) => {
    // Ensure consistent module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "./app"),
    };

    // Production optimizations
    if (!dev) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      };
    }

    return config;
  },
  // Compress responses
  compress: true,
  // Enable build time optimizations
  optimizeFonts: true,
  // Reduce bundle size by tree-shaking unused exports
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
      preventFullImport: true,
    },
  },
};

module.exports = nextConfig;

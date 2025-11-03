// next.config.mjs

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Enable React strict mode for better performance debugging
  reactStrictMode: true,
  // Optimize chunk splitting
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;

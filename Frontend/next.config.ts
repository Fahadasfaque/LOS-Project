import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Avoids loading 10,000+ modules for Phosphor Icons, charts, and base UI primitives
    optimizePackageImports: ["@phosphor-icons/react", "@base-ui/react", "recharts"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Pastas iniciadas com "." não são rotas no App Router; serve /.well-known/* a partir de /well-known/*.
  async rewrites() {
    return [{ source: "/.well-known/assetlinks.json", destination: "/well-known/assetlinks" }];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;

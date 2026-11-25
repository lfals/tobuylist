import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

export default withNextIntl(nextConfig);

/** @type {import('next').NextConfig} */

// const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "mqyoxoyzzrasoakldhoj.supabase.co",
      },
    ],
    unoptimized: true,
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // キャッシュヘッダーの設定
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=31536000",
          },
        ],
      },
    ];
  },

  eslint: {
    // Warning during builds を無視
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type Checking warnings を無視
    ignoreBuildErrors: true,
  },
  // ビルドの最適化
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // キャッシュの最適化
  experimental: {
    optimizePackageImports: ["@prisma/client", "@/components"],
    optimizeCss: false,
    serverActions: {
      allowedOrigins: ["localhost:3000", "learning-journal.vercel.app"],
    },
  },
  outputFileTracingIncludes: {
    "/api/**/*": [
      "node_modules/.prisma/**/*",
      "node_modules/@prisma/client/**/*",
      ".env*",
      "prisma/**/*",
    ],
  },
  transpilePackages: ["@prisma/client", "bcryptjs"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "@prisma/client", "prisma"];
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  serverRuntimeConfig: {
    // APIルートのタイムアウトを60秒に設定
    apiTimeout: 60000,
  },
};

export default nextConfig;

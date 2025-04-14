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
    //これがないとビルドでエラーになる
    optimizePackageImports: ["@prisma/client"],
    serverActions: true,
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

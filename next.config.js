/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
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
        source: "/favicon.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon-:size*",
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
            value: "public, max-age=86400, stale-while-revalidate=604800",
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
      {
        source: "/api/units/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/api/dashboard",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/api/users/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/api/users/search",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=10, stale-while-revalidate=59",
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
    optimizePackageImports: ["@/components"],
    optimizeCss: false,
    serverActions: {
      allowedOrigins: ["localhost:3000", "learning-journal.vercel.app"],
    },
  },
  transpilePackages: [
    "bcryptjs",
    "@radix-ui/react-dialog",
    "class-variance-authority",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "@prisma/client", "prisma"];
    }
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  serverRuntimeConfig: {
    // APIルートのタイムアウトを60秒に設定
    apiTimeout: 60000,
  },
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;

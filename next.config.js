/** @type {import('next').NextConfig} */
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
    outputFileTracingRoot: undefined,
    outputFileTracingExcludes: {
      "*": [
        "node_modules/@swc/core-linux-x64-gnu",
        "node_modules/@swc/core-linux-x64-musl",
        "node_modules/@esbuild/linux-x64",
      ],
    },
    outputFileTracingIncludes: {
      "*": ["node_modules/.prisma/**/*"],
    },
  },
};

export default nextConfig;

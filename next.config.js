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
};

export default nextConfig;

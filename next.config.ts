import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://54.157.223.9:8080/:path*',
      },
    ];
  },
};

export default nextConfig;

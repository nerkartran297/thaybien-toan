import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "phucnguyenguitar.com",
          },
        ],
        destination: "https://www.phucnguyenguitar.com/:path*",
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;

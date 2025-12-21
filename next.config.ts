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
  // Exclude large packages from serverless function bundle
  // These packages will be loaded from node_modules at runtime instead of being bundled
  serverExternalPackages: [
    'mongodb',
    'mongoose',
    'mongoose-sequence',
    'bcryptjs',
    'jose',
    'nodemailer',
    'pino',
    'pino-pretty',
  ],
};

export default nextConfig;

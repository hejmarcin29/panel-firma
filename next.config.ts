import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure native modules remain external in RSC/route handlers (fixes Windows Turbopack errors)
  serverExternalPackages: [
    'better-sqlite3',
    '@node-rs/argon2',
  ],
};

export default nextConfig;

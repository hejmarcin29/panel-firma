import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['imapflow', 'pino', 'mailparser'],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Wyłączamy minifikację SWC, bo potrafi się zawiesić przy małej ilości RAMu
  swcMinify: false,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;

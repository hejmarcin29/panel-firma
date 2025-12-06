import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    // Ograniczenie zużycia pamięci przez wyłączenie niektórych funkcji cache'owania w buildzie
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;

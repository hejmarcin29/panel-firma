import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure native modules remain external in RSC/route handlers (fixes Windows Turbopack errors)
  serverExternalPackages: ["better-sqlite3", "@node-rs/argon2"],
  async redirects() {
    return [
      { source: "/zlecenia", destination: "/montaz", permanent: true },
      { source: "/zlecenia/:id", destination: "/montaz/:id", permanent: true },
      { source: "/zlecenia/nr/:orderNo", destination: "/montaz/nr/:orderNo", permanent: true },
      // Checklist boards old paths → new unified prefix
      { source: "/montaze", destination: "/checklist/montaz", permanent: true },
      { source: "/dostawy", destination: "/checklist/dostawa", permanent: true },
    ];
  },
};

export default nextConfig;
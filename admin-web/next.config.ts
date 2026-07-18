import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    SORCYN_API_URL: process.env.SORCYN_API_URL ?? "http://localhost:3000",
  },
};

export default nextConfig;

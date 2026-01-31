import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: [
    "@airline-protocol/client",
    "@airline-protocol/config",
    "@airline-protocol/idl"
  ]
};

export default nextConfig;

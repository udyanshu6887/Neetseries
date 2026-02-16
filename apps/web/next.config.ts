import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mirai/types",
    "@mirai/config",
    "@mirai/db",
    "@mirai/services",
  ],
};

export default nextConfig;

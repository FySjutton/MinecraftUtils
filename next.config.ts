import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
    reactStrictMode: true,
    images: {
        domains: ['github.com'],
    },
};

export default nextConfig;

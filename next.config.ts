import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app. A stray lockfile in the user's home
  // directory otherwise makes Next infer the wrong root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.swu-db.com", pathname: "/**" },
      { protocol: "https", hostname: "api.swu-db.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
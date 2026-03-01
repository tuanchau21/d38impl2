import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In dev, proxy /api to backend so session cookies work (same origin)
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      const base = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
      return [{ source: "/api/:path*", destination: `${base}/api/:path*` }];
    }
    return [];
  },
};

export default nextConfig;

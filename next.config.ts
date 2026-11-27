import type { NextConfig } from "next";
import { securityHeaders } from "./src/server/security-headers";

const development = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Photos are served resized; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // A quality prop outside this list is served as the nearest one. 90 is for art with fine
    // detail (the prize medals)
    qualities: [75, 90],
    // YouTube thumbnails (gallery video tiles, prototype previews)
    remotePatterns: [{ protocol: "https", hostname: "img.youtube.com" }],
  },
  // Native module and its loader stay outside the server bundle
  serverExternalPackages: ["better-sqlite3", "@node-rs/argon2"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders(development) }];
  },
};

export default nextConfig;

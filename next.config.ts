import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Photos are served resized; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // YouTube thumbnails (gallery video tiles, prototype previews)
    remotePatterns: [{ protocol: "https", hostname: "img.youtube.com" }],
  },
};

export default nextConfig;

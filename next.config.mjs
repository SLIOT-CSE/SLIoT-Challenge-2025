import { COMING_SOON, fullSiteRoutes } from "./src/config/site.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Gallery photos are served resized; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // YouTube thumbnails used by the gallery video tiles
    remotePatterns: [{ protocol: "https", hostname: "img.youtube.com" }],
  },
  async redirects() {
    if (!COMING_SOON) return [];
    // Temporary (307) so browsers don't cache them once the full site is back
    return fullSiteRoutes.map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;

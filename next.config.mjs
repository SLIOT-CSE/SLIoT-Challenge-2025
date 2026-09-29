/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Gallery photos are served resized; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // YouTube thumbnails used by the gallery video tiles
    remotePatterns: [{ protocol: "https", hostname: "img.youtube.com" }],
  },
};

export default nextConfig;

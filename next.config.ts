import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Add your image CDN / CMS hosts here when real photography arrives.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/go/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/embeds/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    return [
      // One canonical host: send www to the apex with a permanent 308.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.unclejetlag.com" }],
        destination: "https://unclejetlag.com/:path*",
        permanent: true,
      },
      { source: "/destination/:slug", destination: "/destinations/:slug", permanent: true },
      { source: "/visa", destination: "/visas", permanent: true },
      { source: "/tech", destination: "/travel-tech", permanent: true },
      { source: "/visas/guides", destination: "/visas#guides", permanent: false },
      { source: "/willard-munyaradzi-kachere", destination: "/authors/uncle-jetlag", permanent: true },
      { source: "/willard-kachere", destination: "/authors/uncle-jetlag", permanent: true },
      { source: "/founder", destination: "/authors/uncle-jetlag", permanent: true },
      { source: "/travel-tools", destination: "/tools", permanent: true },
      { source: "/travel-security", destination: "/security", permanent: true },
    ];
  },
};

export default nextConfig;

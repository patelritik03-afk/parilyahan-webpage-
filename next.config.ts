import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "sharp"],
  // The menu poster reads its fonts and artwork from disk, so make sure they ship with the deployment.
  outputFileTracingIncludes: {
    "/api/poster/[date]": ["./src/assets/poster/**/*"],
  },
  images: {
    // AVIF is much smaller than WebP for photos; browsers that cannot show it still get WebP.
    formats: ["image/avif", "image/webp"],
    // 50 is used for the dark hero/banner photos, which sit under a dark overlay.
    qualities: [50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Google Search Console checks this file under /menu/ for the "/menu/" property; the real file lives in public/.
  async rewrites() {
    return [
      { source: "/menu/googleef5a936795fdf5bd.html", destination: "/googleef5a936795fdf5bd.html" },
    ];
  },
};

export default nextConfig;

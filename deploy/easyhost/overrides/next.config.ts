import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Next.js settings for the STATIC build that runs on ordinary web hosting (Easyhost).
 *
 * deploy/easyhost/build.mjs copies this file over next.config.ts inside a temporary copy of the
 * project, so the main next.config.ts (used on Vercel) is never touched.
 *
 * Differences from the Vercel build:
 *   - `output: "export"`: every page becomes a plain HTML file; there is no Node server.
 *   - `trailingSlash`: /en/office/ is the folder /en/office/index.html, which every web server serves.
 *   - images: the Vercel image optimiser does not exist here, so the build script pre-makes the sizes and
 *     image-loader.ts points each <Image> at them.
 *   - no headers() and redirects(): a static export ignores them. The same rules live in the .htaccess file.
 */
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default withNextIntl(nextConfig);

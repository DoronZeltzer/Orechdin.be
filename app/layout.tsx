import type { Metadata } from "next";
import { SITE } from "@/lib/site";
// Import the global stylesheet at the root so every route — including the
// locale-less /_not-found, which never enters app/[locale]/layout.tsx — gets
// Tailwind and the site's base styles. Global CSS injected from a page/
// not-found file is unreliable; a layout import is the supported entry point.
import "./globals.css";

/**
 * Root layout — intentionally a passthrough.
 *
 * The real <html>/<body> shell (fonts, theme, header, footer, NEO) lives in
 * `app/[locale]/layout.tsx`, which every user-facing route flows through. This
 * root exists only so Next.js has a place to hang app-wide metadata — chiefly
 * `metadataBase`, so that social-image and canonical URLs on the locale-less
 * `/_not-found` route resolve against the real site origin instead of silently
 * falling back to `http://localhost:3000`. Because it returns children
 * verbatim, it never emits a second <html> for locale routes.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

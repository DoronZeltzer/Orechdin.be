import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Static file: needed so the site can also be built as plain files for ordinary web hosting.
export const dynamic = "force-static";

/**
 * Web app manifest. Mostly serves iOS / Android "Add to home screen"
 * and Windows tile metadata. The site itself is not a full PWA — there
 * is no service worker — so `display: "browser"` is honest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.title} | ${SITE.shortName}`,
    short_name: SITE.title,
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#95b6df",
    lang: "en",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}

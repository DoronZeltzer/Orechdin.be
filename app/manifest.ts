import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest. Mostly serves iOS / Android "Add to home screen"
 * and Windows tile metadata. The site itself is not a full PWA — there
 * is no service worker — so `display: "browser"` is honest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.legalName,
    short_name: SITE.title,
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: "#f5efe6",
    theme_color: "#1a1814",
    lang: "nl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}

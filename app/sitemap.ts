import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { LOCALES } from "@/i18n/routing";
import { TRANSLATION_READY } from "@/lib/i18n-status";

const PATHS = ["", "/services", "/lawyers", "/office", "/contact", "/privacy", "/cookies", "/legal-notice"];

/**
 * One entry per page and ready language, each carrying the links to its
 * counterparts in the other ready languages. Languages that still show the
 * English text are left out until their translation is approved.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const ready = LOCALES.filter((l) => TRANSLATION_READY[l]);
  const url = (l: string, p: string) => `${base}/${l}${p}`;

  return ready.flatMap((l) =>
    PATHS.map((p) => ({
      url: url(l, p),
      lastModified: new Date(),
      changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(ready.map((x) => [x, url(x, p)])),
      },
    })),
  );
}

import type { Metadata } from "next";
import { SITE, INDEXABLE } from "@/lib/site";
import { LOCALES, type Locale } from "@/i18n/routing";
import { TRANSLATION_READY } from "@/lib/i18n-status";

const base = SITE.url.replace(/\/$/, "");

const OG_LOCALE: Record<Locale, string> = {
  en: "en_BE",
  nl: "nl_BE",
  he: "he_IL",
};

/** `/en`, `/en/lawyers`, `/nl/office`: every language has its own prefix. */
const localePath = (l: Locale, p: string) => (p === "/" ? `/${l}` : `/${l}${p}`);

/**
 * Canonical, language relationships, robots, Open Graph and Twitter for a page.
 *
 * Language relationships (hreflang):
 *   - Only languages with an approved translation are declared (see
 *     lib/i18n-status.ts). A language that still shows the English text is not
 *     presented to search engines as a Dutch or Hebrew page.
 *   - `x-default` is the English page, the master.
 *   - A page in a language that is not ready names the English page as its
 *     canonical and is marked noindex, so it can never compete with its source.
 *
 * Indexing as a whole stays off until `NEXT_PUBLIC_ALLOW_INDEXING="true"` is
 * set on the deployment that is served from the firm's real domain.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale?: Locale;
  /** Use the title exactly as given, without the " | ORECH/DIN" suffix. */
  absoluteTitle?: boolean;
  /** The page text exists in English only (privacy statement, cookie policy). In other
   *  languages it names the English page as canonical, is not offered as a translation
   *  and is not indexed. */
  englishOnly?: boolean;
}): Metadata {
  const path = opts.path === "" ? "/" : opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const locale = opts.locale ?? "en";
  const ready = TRANSLATION_READY[locale] && !(opts.englishOnly && locale !== "en");

  const fullTitle = opts.absoluteTitle ? opts.title : `${opts.title} | ${SITE.title}`;
  const canonicalPath = localePath(ready ? locale : "en", path);

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    if (TRANSLATION_READY[l] && (!opts.englishOnly || l === "en")) languages[l] = `${base}${localePath(l, path)}`;
  }
  languages["x-default"] = `${base}${localePath("en", path)}`;

  const index = INDEXABLE && ready;

  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: canonicalPath, languages },
    robots: { index, follow: index },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      url: `${base}${localePath(locale, path)}`,
      siteName: SITE.title,
      title: fullTitle,
      description: opts.description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: opts.description,
    },
  };
}

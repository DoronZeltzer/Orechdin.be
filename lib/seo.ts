import type { Metadata } from "next";
import { SITE } from "@/lib/site";

const base = SITE.url.replace(/\/$/, "");

const LOCALES = ["nl", "en", "fr"] as const;
const DEFAULT_LOCALE = "nl";

const OG_LOCALE_MAP: Record<(typeof LOCALES)[number], string> = {
  nl: "nl_BE",
  en: "en_BE",
  fr: "fr_BE",
};

/**
 * Canonical + Open Graph + Twitter for App Router pages (humans-first copy).
 *
 * When `locale` is provided, generates per-locale `alternates.canonical` plus
 * `alternates.languages` so search engines understand every language variant
 * of the same page. URLs follow next-intl's `localePrefix: 'as-needed'` rule
 * — the default locale (`nl`) lives at unprefixed paths.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale?: (typeof LOCALES)[number];
}): Metadata {
  const path = opts.path === "" ? "/" : opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const fullTitle = `${opts.title} | ${SITE.title}`;
  const locale = opts.locale ?? DEFAULT_LOCALE;

  const localePath = (l: (typeof LOCALES)[number], p: string) => {
    if (l === DEFAULT_LOCALE) return p;
    return p === "/" ? `/${l}` : `/${l}${p}`;
  };

  const canonicalPath = localePath(locale, path);
  const url = `${base}${canonicalPath === "/" ? "/" : canonicalPath}`;

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = `${base}${localePath(l, path) || "/"}`;
  }
  languages["x-default"] = `${base}${localePath(DEFAULT_LOCALE, path) || "/"}`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE_MAP[locale],
      url,
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

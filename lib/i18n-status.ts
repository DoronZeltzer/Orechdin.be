import type { Locale } from "@/i18n/routing";

/**
 * Which languages have an approved translation.
 *
 * English is the master. Dutch and Hebrew are written after the English text is
 * final, so for now their catalogues are empty and every string falls back to
 * English (see i18n/request.ts). Until a language is marked ready here:
 *
 *   - its pages declare `lang="en"`, because that is what the text is, rather
 *     than telling screen readers and search engines it is Dutch or Hebrew;
 *   - Hebrew is not laid out right-to-left, which English text would break;
 *   - its pages ask search engines not to index them, so duplicates of the
 *     English pages are not published under another language's address;
 *   - it is left out of the hreflang links and the sitemap.
 *
 * When a translation is approved, set its flag to true. That one change turns
 * all four behaviours on for that language.
 */
export const TRANSLATION_READY: Record<Locale, boolean> = {
  en: true,
  nl: false,
  he: false,
};

/** The language the page text is actually written in. */
export function contentLocale(locale: Locale): Locale {
  return TRANSLATION_READY[locale] ? locale : "en";
}

export function isRtl(locale: Locale): boolean {
  return contentLocale(locale) === "he";
}

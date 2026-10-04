import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * Languages: English, Dutch, Hebrew. There is no French version.
 *
 * English is the master text. Dutch and Hebrew follow once the English is final
 * (see lib/i18n-status.ts for what that means until then).
 *
 * Every language has its own prefix, `/en`, `/nl` and `/he`, so the three
 * versions are separate, linkable addresses with clear language relationships.
 * The bare `/` sends visitors to `/en`; the browser's language is deliberately
 * not used to guess, so a link always shows what its address says.
 */
export const LOCALES = ["en", "nl", "he"] as const;
export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

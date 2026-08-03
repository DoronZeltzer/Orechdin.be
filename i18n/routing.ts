import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['nl', 'en', 'fr'],
  defaultLocale: 'nl',
  localePrefix: 'as-needed',
  // Lock the bare `/` route to Dutch regardless of the visitor's
  // Accept-Language header. The firm is in Antwerp; visitors who want
  // English or French use the explicit `/en` / `/fr` prefixes (or the
  // language switcher). Without this flag, next-intl would negotiate
  // against the browser locale and, e.g., serve English to a Brussels
  // commuter whose laptop is set to English, defeating the "Dutch by
  // default" rule the office asked for.
  localeDetection: false,
});
 
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

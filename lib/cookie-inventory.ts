import type { OptionalCategory } from "@/lib/consent";

/**
 * The cookie register behind /cookies.
 *
 * The Belgian DPA expects a policy to name each cookie, its domain, its
 * purpose, its lifetime and who reads it — a prose paragraph saying "we use
 * cookies to improve your experience" does not satisfy it. Keeping the
 * register here rather than in the page body means the published table and
 * the code that actually sets the cookies can be checked against each other.
 *
 * Every entry below was read off this codebase and checked against a live
 * browser, not copied from a template:
 *   - `orechdin_consent` is written by `lib/consent.ts`.
 *   - `NEXT_LOCALE` is written by the next-intl middleware. Nothing in this
 *     repo sets it explicitly, so it only turned up by inspecting
 *     document.cookie on a running page.
 *   - Google Maps is the only third party the site can contact at all.
 *
 * Article 129 governs storing or reading ANY information on the visitor's
 * terminal equipment, so localStorage and sessionStorage belong in this
 * register too. The site currently uses neither; if that changes, list it.
 *
 * When this list changes, bump `CONSENT_VERSION` in `lib/consent.ts` if the
 * change affects an optional category, and bump the policy version below.
 */

export type StorageKind = "cookie" | "localStorage" | "sessionStorage";

export type CookieEntry = {
  /** Translation id under `CookiePage.entries.*`. */
  id: string;
  /** Technical name, shown untranslated. */
  name: string;
  /** Domain that can read it. */
  provider: string;
  kind: StorageKind;
};

export type CookieGroup = {
  /** `null` marks the strictly necessary group, which needs no consent. */
  category: OptionalCategory | null;
  id: "necessary" | OptionalCategory;
  entries: CookieEntry[];
};

export const COOKIE_GROUPS: readonly CookieGroup[] = [
  {
    id: "necessary",
    category: null,
    entries: [
      {
        id: "consent",
        name: "orechdin_consent",
        provider: "orechdin.be",
        kind: "cookie",
      },
      {
        // Written by the next-intl middleware. Easy to miss when reading the
        // source, since nothing in this repo sets it explicitly; it turned up
        // by inspecting document.cookie on a running page. Worth remembering
        // that the register has to be checked against a live browser, not
        // only against the code.
        id: "locale",
        name: "NEXT_LOCALE",
        provider: "orechdin.be",
        kind: "cookie",
      },
    ],
  },
  {
    id: "functional",
    category: "functional",
    entries: [
      {
        // Described by domain rather than by cookie name on purpose. Cookies
        // Google sets on its own domain cannot be read back from this site,
        // so any specific list here would be copied from a template and
        // asserted without verification. Naming the domain is checkable; the
        // policy links to Google's own disclosure for the rest.
        id: "googleMaps",
        name: "Cookies set by Google",
        provider: "google.com, maps.google.com",
        kind: "cookie",
      },
    ],
  },
  {
    // Declared and enforced, but empty: the site runs no audience measurement
    // today. The switch exists so that adding one is gated from the first
    // deploy instead of being retrofitted onto a live site.
    id: "statistics",
    category: "statistics",
    entries: [],
  },
] as const;

/** Shown on the policy and bumped whenever the register above changes. */
export const COOKIE_POLICY_VERSION = "1.1";
export const COOKIE_POLICY_UPDATED = "2026-10-01";

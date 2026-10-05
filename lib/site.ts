/**
 * Canonical public URL for this deployment.
 *
 * Production points at the live domain; preview environments (Vercel
 * preview branches, local dev, smoke-test runs) override this with
 * `NEXT_PUBLIC_SITE_URL` so generated canonicals, sitemaps, robots and
 * Open Graph URLs all match the host the page is actually served from.
 */
const RAW_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.orechdin.be")
  .trim()
  .replace(/\/$/, "");

export const SITE_URL: string = RAW_SITE_URL;

/**
 * Whether search engines may index this deployment.
 *
 * Off unless `NEXT_PUBLIC_ALLOW_INDEXING="true"` is set. The site is also served
 * from a Vercel address while the firm's real domain still points at the old
 * site, and a second public copy of the pages must not compete with it in
 * search results. Set the variable only on the deployment that is served from
 * www.orechdin.be, when the site goes live there.
 */
export const INDEXABLE: boolean = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

/** Verified from https://www.orechdin.be/ and linked pages (privacy policy). Do not invent fields. */
export const SITE = {
  // In running text the firm is written ORECH/DIN.
  title: "ORECH/DIN",
  legalName: "Law firm Nir Zeltzer - Orechdin (ORECHDIN)",
  shortName: "Boutique Law Office",
  description:
    "ORECH/DIN is a boutique law office in Antwerp assisting individuals, entrepreneurs and businesses with legal matters in Belgium, including clients from abroad.",
  url: SITE_URL,
  locale: "en_BE",
  address: {
    street: "Lange Herentalsestraat 122",
    postal: "2018",
    city: "Antwerp",
    country: "Belgium",
    singleLine: "Lange Herentalsestraat 122, 2018 Antwerp, Belgium",
  },
  phoneDisplay: "+32 3 227 50 57",
  phoneTel: "+3232275057",
  email: "info@orechdin.be",
  website: "www.orechdin.be",
  /**
   * WhatsApp number, in international format without "+" or spaces: +32 3 227 50 57 (the office number),
   * confirmed by the firm. Set it to null to hide the WhatsApp button everywhere.
   */
  whatsapp: "3232275057" as string | null,
  /** Opens directions in the visitor's maps app. A plain link, so nothing loads from Google until it is clicked. */
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Lange+Herentalsestraat+122%2C+2018+Antwerp%2C+Belgium",
  kbo: "0879.210.671",
  court: "Antwerp business court (RPR Antwerpen)",
  copyrightEntity: "ORECHDIN BV",
  privacyUrl: "/privacy",
  livePrivacyUrl: "https://www.orechdin.be/privacy-policy",
  dpo: {
    name: "Meester Deborah Johnson",
    email: "dj@orechdin.be",
    phoneDisplay: "03/227.50.57",
  },
} as const;

/**
 * All visual assets are hosted locally so the site has zero third-party
 * image dependencies in production.
 *
 * - `logo`: typographic SVG wordmark in the firm palette (Playfair +
 *   Inter), generated locally so we do not depend on any remote CDN.
 *   Both the header and JSON-LD `Organization.logo` point at it.
 * - `heroBg`: commissioned editorial photograph rendered locally as
 *   WebP (see `public/media/site/`).
 * - `nirPhoto` / `deborahPhoto`: original lawyer portraits — kept as
 *   PNG until the optimisation pipeline is re-verified.
 */
export const MEDIA = {
  logo: "/media/site/logo-orechdin.webp",
  // Hero image: a commissioned editorial photograph of a Belgian chambers
  // interior — panelled walls, leather-bound code reporters, antique brass
  // green-shade lamp, looking onto Antwerp's Grote Markt. Replaces the
  // generic Wix-hosted office shot with a piece tuned for the firm's tone.
  // Lawyer portraits below remain the originals (`/media/lawyers/*`).
  heroBg: "/media/site/antwerp-chambers.webp",
  nirPhoto: "/media/lawyers/nir.webp?v=1948d615",
  deborahPhoto: "/media/lawyers/deborah.webp?v=664af79c",
} as const;

export const LAWYERS = [
  {
    slug: "nir-zeltzer",
    name: "Nir Zeltzer",
    role: "Lawyer",
    mobileDisplay: "+32 477 58 78 97",
    mobileTel: "+32477587897",
    email: "nir@orechdin.be",
  },
  {
    slug: "deborah-johnson",
    name: "Deborah Johnson",
    role: "Lawyer",
    mobileDisplay: "+32 495 81 00 63",
    mobileTel: "+32495810063",
    email: "dj@orechdin.be",
  },
] as const;

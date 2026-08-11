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

/** Verified from https://www.orechdin.be/ and linked pages (privacy policy). Do not invent fields. */
export const SITE = {
  title: "Orechdin",
  legalName: "Law firm Nir Zeltzer - Orechdin (ORECHDIN)",
  shortName: "Orechdin Law Office",
  description:
    "Orechdin Law Office - general practice in Antwerp: commercial, civil, criminal, family, employment, real estate, traffic, and related matters.",
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
  kbo: "0879.210.671",
  court: "Antwerp business court (RPR Antwerpen)",
  copyrightEntity: "ORECHDIN BV",
  privacyUrl: "/privacy",
  livePrivacyUrl: "https://www.orechdin.be/privacy-policy",
  disclaimer:
    "Disclaimer: Orechdin Law Office can not commit to any result, but will make all efforts to achieve the best possible result.",
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
  logo: "/media/site/logo-wordmark.svg",
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
    role: "Senior partner",
    mobileDisplay: "+32 477 58 78 97",
    mobileTel: "+32477587897",
    email: "nir@orechdin.be",
    bio: [
      "Nir obtained his Diploma in law at the Antwerp University and has practised since 1999. He has built considerable experience in the real estate sector, supported by comprehensive studies in Real Estate and a diploma in Real Estate Expertise, to ensure the necessary technical knowledge in this field. Furthermore, he obtained a diploma in Master in Business Law at Antwerp University.",
      "Nir is an experienced lawyer with strong analytical powers. His driving goal is to achieve results for clients, which he accomplishes with the support of a broad range of sources and networks. He is very successful in resolving conflicts and achieving optimum results during negotiations, even under pressure and through complex procedures.",
    ],
  },
  {
    slug: "deborah-johnson",
    name: "Deborah Johnson",
    role: "Lawyer",
    mobileDisplay: "+32 495 81 00 63",
    mobileTel: "+32495810063",
    email: "dj@orechdin.be",
    bio: [
      "Deborah obtained her diploma in law at the Antwerp University and started her career as lawyer at the Turnhout Bar. In 2002, she moved to Antwerp, when she joined the Orechdin law office. Here, Deborah primarily deals in the fields of family law, criminal law, employment law, and traffic cases. Deborah approaches cases with profound insight, and her professional yet human touch is greatly appreciated by the law firm’s customers.",
    ],
  },
] as const;

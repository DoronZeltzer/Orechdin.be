import type { Metadata } from "next";
import { Roboto_Slab } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LegalServiceJsonLd } from "@/components/layout/json-ld";
import { OrganizationJsonLd } from "@/components/layout/organization-json-ld";
import { WebsiteJsonLd } from "@/components/layout/website-json-ld";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SITE } from "@/lib/site";
import "../globals.css";

// Brand web typeface. The brand guidelines (section 02.2) name Egyptian Slate
// Pro, a commercial slab serif, as "the font that should be used for websites".
// Roboto Slab is the closest freely licensed match: every candidate was scored
// against the real glyphs embedded in the guidelines PDF (letter-shape overlap
// at matched x-height, width and stroke weight) and it came out first, ahead of
// Arvo, Zilla Slab and Bitter. The site's previous stand-in, a plain sans, was
// among the worst matches.
//
// It is a variable font, so one file serves every weight. The brand uses two:
// Regular for text and Bold for headings. The brand Bold is very heavy, and
// Roboto Slab matched it best at 800 (89% of its ink; the usual 700 is 83%), so
// headings use 800. Light (300) is kept for the large slogan lines, as in the
// guidelines. Roboto Slab has no italic; the brand does not use one either.
const slab = Roboto_Slab({
  subsets: ["latin", "latin-ext"],
  variable: "--font-slab",
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.title} | ${SITE.address.city}`,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "en_BE",
    url: SITE.url,
    siteName: SITE.title,
    title: `${SITE.title} - ${SITE.shortName}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.title} - ${SITE.shortName}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();
  const tNav = await getTranslations({ locale, namespace: "Nav" });

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={slab.variable}
    >
      <body className="min-h-screen font-prose bg-orech-paper text-orech-ink selection:bg-orech-bronze/30">
        <NextIntlClientProvider messages={messages}>
          <LegalServiceJsonLd />
          <OrganizationJsonLd />
          <WebsiteJsonLd />
          {/* Consent wraps the whole tree: the footer's "cookie settings"
              control and the gated Google Maps embed both read from it. */}
          <ConsentProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-orech-ink focus:px-4 focus:py-2 focus:text-orech-paper"
            >
              {tNav("skipToContent")}
            </a>
            <SiteHeader />
            <div>
              {children}
              <SiteFooter />
            </div>
          <CookieBanner />
          </ConsentProvider>
        </NextIntlClientProvider>

      </body>
    </html>
  );
}


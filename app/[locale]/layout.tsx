import type { Metadata } from "next";
import { JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LegalServiceJsonLd } from "@/components/layout/json-ld";
import { OrganizationJsonLd } from "@/components/layout/organization-json-ld";
import { WebsiteJsonLd } from "@/components/layout/website-json-ld";
import { NeoProvider } from "@/components/neo/neo-context";
import { NeoShell } from "@/components/neo/neo-shell";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SITE } from "@/lib/site";
import "../globals.css";

// Brand web typeface. The guidelines specify Slate for all website text;
// Source Sans 3 is the closest freely-licensed humanist sans and stands in for
// it. A single family drives every role (display, prose, UI) — the per-role
// CSS vars (--font-display / --font-prose / --font-display-italic) alias
// --font-sans in globals.css, so the whole site renders in one clean sans.
const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-prose bg-orech-paper text-orech-ink selection:bg-orech-bronze/30">
        <NextIntlClientProvider messages={messages}>
          <LegalServiceJsonLd />
          <OrganizationJsonLd />
          <WebsiteJsonLd />
          {/* Consent wraps the whole tree: the footer's "cookie settings"
              control and the gated Google Maps embed both read from it. */}
          <ConsentProvider>
          <NeoProvider>
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
            <NeoShell />
          </NeoProvider>
          <CookieBanner />
          </ConsentProvider>
        </NextIntlClientProvider>

      </body>
    </html>
  );
}


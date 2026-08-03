import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Source_Serif_4,
} from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LegalServiceJsonLd } from "@/components/layout/json-ld";
import { OrganizationJsonLd } from "@/components/layout/organization-json-ld";
import { WebsiteJsonLd } from "@/components/layout/website-json-ld";
import { NeoProvider } from "@/components/neo/neo-context";
import { NeoShell } from "@/components/neo/neo-shell";
import { SITE } from "@/lib/site";
import "../globals.css";

// Display face for headlines, set in light/regular weights to read like a
// commissioned wordmark rather than a marketing banner.
const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
});

// Italic display face used exclusively for the firm's signature italic pulls
// (eyebrows, em-italic in headlines, pull-quotes). Cormorant Garamond is the
// editorial standard — what NYT Magazine, Pentagram and A24 reach for when
// they need an italic that reads as composed rather than decorative.
const displayItalic = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display-italic",
  weight: ["400", "500"],
  style: ["italic"],
  display: "swap",
});

// Long-form prose: Source Serif 4 — calibrated for screen reading, sourced
// from Adobe's editorial program. Used wherever the visitor reads more than
// one sentence (lead paragraphs, body copy, dossier prose).
const proseSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-prose",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// UI chrome only: navigation, buttons, form labels, tabular numerics. Inter
// stays disciplined — no uses inside body prose.
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
      className={`${display.variable} ${displayItalic.variable} ${proseSerif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-prose bg-orech-paper text-orech-ink selection:bg-orech-bronze/30">
        <NextIntlClientProvider messages={messages}>
          <LegalServiceJsonLd />
          <OrganizationJsonLd />
          <WebsiteJsonLd />
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
        </NextIntlClientProvider>

      </body>
    </html>
  );
}


import type { Metadata } from "next";
import Link from "next/link";

/**
 * Global 404 for requests that never enter a language segment (for example a
 * malformed path, or the removed French version at /fr). Language-scoped misses
 * are handled by `app/[locale]/not-found.tsx`, with the full site and
 * translations. This fallback sits above the translation provider, so it cannot
 * translate; it renders its own <html> and speaks English, the master language.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen font-prose bg-brand-white text-brand-black selection:bg-brand-blue/40">
        <main className="min-h-screen bg-brand-wash">
          <div className="mx-auto flex max-w-editorial flex-col gap-8 px-6 py-24 lg:px-10 lg:py-32">
            <p className="eyebrow">Error 404</p>
            <h1 className="text-4xl md:text-5xl">Page not found</h1>
            <p className="max-w-prose text-lg text-brand-black-80">
              The page you are looking for does not exist or has moved. Return to the home page or contact the office.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/en"
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-brand-blue bg-brand-blue px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-brand-black"
              >
                Home
              </Link>
              <Link
                href="/en/contact"
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-brand-black-60 px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-brand-black"
              >
                Contact
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

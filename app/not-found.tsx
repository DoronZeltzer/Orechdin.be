import type { Metadata } from "next";
import Link from "next/link";

/**
 * Global 404 for requests that never enter a `/[locale]` segment (e.g. a
 * malformed path at the bare domain root). Locale-scoped misses are handled by
 * `app/[locale]/not-found.tsx`, which keeps the full site chrome and
 * translations. This fallback lives above the `next-intl` provider, so it can't
 * translate — it renders its own <html> (the root layout is a passthrough) and
 * speaks the firm's default locale, Dutch.
 */
export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="nl">
      <body className="min-h-screen font-prose bg-orech-paper text-orech-ink selection:bg-orech-bronze/30">
        <main className="min-h-screen bg-orech-paper text-orech-ink">
          <div className="mx-auto flex max-w-editorial flex-col gap-10 px-6 py-24 lg:px-10 lg:py-32">
            <p className="eyebrow">Fout 404</p>
            <h1 className="display-headline text-4xl md:text-5xl">
              Pagina niet gevonden
            </h1>
            <div className="rule-gold" aria-hidden />
            <p className="lead max-w-prose text-lg text-orech-ink/80">
              De pagina die u zoekt bestaat niet of is verplaatst. Keer terug
              naar de startpagina of neem contact op met het kantoor.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-orech-ink/15 bg-orech-ink px-6 py-3 font-display text-sm uppercase tracking-eyebrow text-orech-paper transition hover:bg-orech-ink/90"
              >
                Naar de startpagina
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-orech-ink/20 bg-transparent px-6 py-3 font-display text-sm uppercase tracking-eyebrow text-orech-ink transition hover:bg-orech-ink/5"
              >
                Contacteer het kantoor
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

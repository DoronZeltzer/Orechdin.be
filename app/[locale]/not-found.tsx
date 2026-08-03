import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

/**
 * 404 page rendered inside the locale segment so it inherits the
 * `next-intl` provider, the site chrome and the correct `<html lang>`.
 * Editorial layout to match the rest of the site (no playful 404 art —
 * this is a law firm).
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="min-h-[70vh] bg-orech-paper text-orech-ink">
      <div className="mx-auto flex max-w-editorial flex-col gap-10 px-6 py-24 lg:px-10 lg:py-32">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="display-headline text-4xl md:text-5xl">{t("title")}</h1>
        <div className="rule-gold" aria-hidden />
        <p className="lead max-w-prose text-lg text-orech-ink/80">{t("lead")}</p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-orech-ink/15 bg-orech-ink px-6 py-3 font-display text-sm uppercase tracking-eyebrow text-orech-paper transition hover:bg-orech-ink/90"
          >
            {t("ctaHome")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-orech-ink/20 bg-transparent px-6 py-3 font-display text-sm uppercase tracking-eyebrow text-orech-ink transition hover:bg-orech-ink/5"
          >
            {t("ctaContact")}
          </Link>
        </div>
      </div>
    </main>
  );
}

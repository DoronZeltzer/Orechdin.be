"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

/**
 * Per-locale error boundary. Next.js renders this for runtime errors
 * inside the `[locale]` segment so the chrome (header / footer / lang)
 * stays consistent. Logging hook is intentionally minimal — wire to
 * Sentry / Vercel Analytics later by replacing the console call.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error("[Orechdin] runtime error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-[70vh] bg-orech-paper text-orech-ink">
      <div className="mx-auto flex max-w-editorial flex-col gap-10 px-6 py-24 lg:px-10 lg:py-32">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="display-headline text-4xl md:text-5xl">{t("title")}</h1>
        <div className="rule-gold" aria-hidden />
        <p className="lead max-w-prose text-lg text-orech-ink/80">{t("lead")}</p>

        <div className="flex flex-wrap gap-4 pt-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md border border-orech-ink/15 bg-orech-ink px-6 py-3 font-display text-sm uppercase tracking-eyebrow text-orech-paper transition hover:bg-orech-ink/90"
          >
            {t("ctaRetry")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-orech-ink/20 bg-transparent px-6 py-3 font-display text-sm uppercase tracking-eyebrow text-orech-ink transition hover:bg-orech-ink/5"
          >
            {t("ctaHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}

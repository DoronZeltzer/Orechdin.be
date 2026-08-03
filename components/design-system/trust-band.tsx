"use client";

import { useTranslations } from "next-intl";

/**
 * `TrustBand` — restrained editorial belt sitting under the hero.
 *
 * Lists the practice areas the firm publishes on orechdin.be. No invented
 * disciplines. The band is intentionally typographic, not chip-y: a single
 * ruled line above and below, monospaced eyebrow, italic display set in
 * Cormorant Garamond, separated by hairline interpuncts.
 *
 * Single source of truth: `lib/site.ts` and `data/neo-kb.json`.
 */
const AREA_KEYS = [
  "commercial",
  "civil",
  "criminal",
  "family",
  "employment",
  "realEstate",
  "traffic",
] as const;

export function TrustBand() {
  const t = useTranslations("TrustBand");

  return (
    <div className="mt-20 w-full border-y border-orech-line/70 bg-orech-paper/60 backdrop-blur-sm">
      <div className="mx-auto max-w-wide px-6 sm:px-10 lg:px-16 py-10">
        <p className="eyebrow text-center">{t("eyebrow")}</p>
        <ul
          className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          aria-label={t("eyebrow")}
        >
          {AREA_KEYS.map((key, i) => (
            <li
              key={key}
              className="flex items-center gap-x-6 text-orech-ink/85"
            >
              <span className="italic-display text-[1.05rem] tracking-tight">
                {t(`areas.${key}`)}
              </span>
              {i < AREA_KEYS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden h-1 w-1 rounded-full bg-orech-bronze/50 sm:inline-block"
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

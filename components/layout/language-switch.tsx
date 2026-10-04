"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, LOCALES, usePathname } from "@/i18n/routing";

const LABEL = { en: "EN", nl: "NL", he: "HE" } as const;

/**
 * EN | NL | HE. Each link goes to the same page in the other language
 * (`/en/lawyers` becomes `/nl/lawyers`). The current language is bold.
 */
export function LanguageSwitch({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <div className={className} role="group" aria-label={t("localeSwitcher")}>
      {LOCALES.map((l, i) => (
        <span key={l} className="inline-flex items-center gap-2">
          <Link
            href={pathname}
            locale={l}
            hrefLang={l}
            translate="no"
            onClick={onNavigate}
            aria-current={l === locale ? "true" : undefined}
            className={`transition-colors ${l === locale ? "font-extrabold text-brand-black" : "text-brand-black-80 hover:text-brand-black"}`}
          >
            {LABEL[l]}
          </Link>
          {i < LOCALES.length - 1 && (
            <span aria-hidden className="text-brand-black-40">
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Wraps a page whose text exists in English only (the privacy statement and the cookie
 * policy, whose final wording is still to be approved). In another language the reader
 * gets one short notice in their own language, and the English text is marked as English
 * (lang="en", left to right) so screen readers pronounce it correctly.
 */
export function EnglishOnly({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("Common");
  if (locale === "en") return <>{children}</>;
  return (
    <>
      <div className="bg-brand-wash">
        <p className="mx-auto max-w-4xl px-6 py-3 text-[0.9rem] text-brand-black-80">{t("englishOnly")}</p>
      </div>
      <div lang="en" dir="ltr">
        {children}
      </div>
    </>
  );
}

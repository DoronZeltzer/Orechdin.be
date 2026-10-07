import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/**
 * Wraps a page whose text is shown in English only in one language: the privacy statement and the cookie policy
 * in Hebrew. The reader gets one short notice in Hebrew (right to left), and the whole policy below it is one
 * coherent English document: lang="en", left to right, so screen readers pronounce it correctly and Hebrew and
 * English prose are never mixed inside the policy.
 */
export async function EnglishOnly({
  locale,
  notice,
  children,
}: {
  locale: string;
  notice: "englishOnlyPrivacy" | "englishOnlyCookies";
  children: ReactNode;
}) {
  if (locale !== "he") return <>{children}</>;
  const t = await getTranslations({ locale, namespace: "Common" });
  return (
    <>
      <div className="bg-brand-wash">
        <p className="mx-auto max-w-4xl px-6 py-3 text-[0.9rem] text-brand-black-80">{t(notice)}</p>
      </div>
      <div lang="en" dir="ltr">
        {children}
      </div>
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useConsent } from "@/components/consent/consent-provider";

/**
 * The permanent way back into the consent dialog.
 *
 * Consent must be withdrawable as easily as it was given, which in practice
 * means a control that is reachable from every page rather than a paragraph
 * in a policy telling visitors to clear their browser. It lives in the footer
 * next to the policy links.
 *
 * Rendered as a link-styled button so it sits in the footer list without
 * looking like a call to action.
 */
export function CookieSettingsButton({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Consent");
  const { openPrefs } = useConsent();

  return (
    <button
      type="button"
      onClick={openPrefs}
      className={
        className ??
        "text-left transition-colors hover:text-orech-bronze"
      }
    >
      {t("settingsLink")}
    </button>
  );
}

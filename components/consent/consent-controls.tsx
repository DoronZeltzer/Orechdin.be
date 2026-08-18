"use client";

import { useTranslations } from "next-intl";
import { useConsent } from "@/components/consent/consent-provider";

/**
 * The withdrawal panel on the cookie policy.
 *
 * Two obligations meet here. Consent must be withdrawable as easily as it was
 * given, so "change" and "withdraw" are plain buttons rather than
 * instructions to go hunting in browser settings. And the visitor is entitled
 * to know what was recorded about them, so the current decision and its date
 * are shown back rather than kept as an opaque cookie value.
 */
export function ConsentControls() {
  const t = useTranslations("Consent");
  const { ready, record, openPrefs, withdraw } = useConsent();

  return (
    <div className="rounded-2xl border border-orech-line bg-orech-slate/50 p-8 shadow-sm">
      <h2 className="font-display text-2xl text-orech-ink md:text-3xl">
        {t("controls.heading")}
      </h2>
      <p className="mt-4 leading-relaxed text-orech-ink/80">
        {t("controls.body")}
      </p>

      <dl className="mt-6 space-y-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-orech-mist">
        <div className="flex flex-wrap gap-x-3">
          <dt>{t("categories.functional.name")}:</dt>
          <dd>
            {!ready
              ? "—"
              : record?.functional
                ? t("controls.granted")
                : t("controls.refused")}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-3">
          <dt>{t("categories.statistics.name")}:</dt>
          <dd>
            {!ready
              ? "—"
              : record?.statistics
                ? t("controls.granted")
                : t("controls.refused")}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-3">
          <dt>{t("controls.recordedOn")}:</dt>
          <dd>
            {ready && record?.decidedAt
              ? record.decidedAt
              : t("controls.noDecision")}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={openPrefs}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orech-ink px-6 py-2.5 text-sm font-semibold text-orech-paper transition-colors hover:bg-orech-bronzeMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted"
        >
          {t("controls.change")}
        </button>
        <button
          type="button"
          onClick={withdraw}
          disabled={!ready || record === null}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-orech-ink px-6 py-2.5 text-sm font-semibold text-orech-ink transition-colors hover:bg-orech-slate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("controls.withdraw")}
        </button>
      </div>

      <p className="mt-5 text-[0.8rem] leading-relaxed text-orech-mist">
        {t("controls.limitation")}
      </p>
    </div>
  );
}

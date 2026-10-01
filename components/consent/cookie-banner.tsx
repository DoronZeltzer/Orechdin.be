"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/components/consent/consent-provider";
import {
  DENY_ALL,
  OPTIONAL_CATEGORIES,
  type ConsentChoices,
} from "@/lib/consent";

/**
 * The consent surface: a first layer (the banner) and a second layer (the
 * preferences dialog), as the Belgian DPA's cookie guidance describes them.
 *
 * Design rules that are legal requirements, not styling opinions:
 *
 *   - "Accept all" and "Refuse all" are rendered by the SAME component with
 *     the SAME classes. Any visual asymmetry between them — colour, size,
 *     weight, order-induced emphasis — is the dark pattern the GBA fines for,
 *     so they are deliberately impossible to style apart here.
 *   - The banner has no dismiss "X". There is no way to make the question go
 *     away that does not record an actual decision, which keeps "closed" from
 *     ever being mistaken for "accepted".
 *   - It does not block the page. A cookie wall is prohibited, so the banner
 *     sits at the foot of the viewport and the site stays usable behind it.
 *   - Optional switches start OFF in the dialog, including for a visitor who
 *     has not decided yet.
 */
export function CookieBanner() {
  const t = useTranslations("Consent");
  const { bannerOpen, prefsOpen, openPrefs, acceptAll, refuseAll } =
    useConsent();

  if (!bannerOpen && !prefsOpen) return null;

  return (
    <>
      {bannerOpen && (
        <div
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-body"
          className="fixed inset-x-0 bottom-0 z-[90] border-t-4 border-brand-black bg-brand-white shadow-[0_-12px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="mx-auto max-w-wide px-6 py-6 lg:px-10">
            <p className="eyebrow">{t("banner.eyebrow")}</p>
            <h2
              id="cookie-banner-title"
              className="mt-2 font-display text-xl text-orech-ink md:text-2xl"
            >
              {t("banner.title")}
            </h2>
            <p
              id="cookie-banner-body"
              className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed text-brand-black-80"
            >
              {t("banner.body")}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Equal prominence is the point: same element, same classes. */}
              <ConsentButton onClick={refuseAll}>
                {t("banner.refuseAll")}
              </ConsentButton>
              <ConsentButton onClick={acceptAll}>
                {t("banner.acceptAll")}
              </ConsentButton>
              <button
                type="button"
                onClick={openPrefs}
                className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-medium text-brand-black underline underline-offset-4 transition-colors hover:text-orech-ink"
              >
                {t("banner.managePreferences")}
              </button>
            </div>

            <p className="mt-4 text-[0.78rem] text-brand-black-80">
              <Link
                href="/cookies"
                className="underline underline-offset-2 hover:text-brand-black"
              >
                {t("banner.cookiePolicy")}
              </Link>
              <span aria-hidden="true"> · </span>
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-brand-black"
              >
                {t("banner.privacyPolicy")}
              </Link>
            </p>
          </div>
        </div>
      )}

      {prefsOpen && <PreferencesDialog />}
    </>
  );
}

/**
 * Both first-layer answers render through this, so "accept" and "refuse"
 * cannot drift apart visually as the design evolves.
 */
function ConsentButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant="dark" onClick={onClick} className="w-full sm:w-auto sm:min-w-[11rem]">
      {children}
    </Button>
  );
}

/** The second layer: per-category choice, with purposes and durations. */
function PreferencesDialog() {
  const t = useTranslations("Consent");
  const { record, closePrefs, acceptAll, refuseAll, save } = useConsent();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Undecided visitors see every optional switch off — never pre-ticked.
  const [draft, setDraft] = useState<ConsentChoices>(() => ({
    functional: record?.functional ?? DENY_ALL.functional,
    statistics: record?.statistics ?? DENY_ALL.statistics,
  }));

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Escape closes the dialog without recording anything, leaving the banner
  // up and the visitor in the refused state.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePrefs();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closePrefs]);

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-orech-ink/40 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-brand-black bg-brand-white p-6 shadow-xl sm:p-8"
      >
        <p className="eyebrow">{t("prefs.eyebrow")}</p>
        <h2
          id="cookie-prefs-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-display text-2xl text-orech-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl"
        >
          {t("prefs.title")}
        </h2>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-brand-black-80">
          {t("prefs.intro")}
        </p>

        <div className="mt-8 space-y-4">
          <CategoryRow
            name={t("categories.necessary.name")}
            purpose={t("categories.necessary.purpose")}
            duration={t("categories.necessary.duration")}
            locked
            checked
            lockedLabel={t("categories.necessary.always")}
          />

          <CategoryRow
            name={t("categories.functional.name")}
            purpose={t("categories.functional.purpose")}
            duration={t("categories.functional.duration")}
            checked={draft.functional}
            onToggle={() =>
              setDraft((prev) => ({ ...prev, functional: !prev.functional }))
            }
            toggleLabel={t("prefs.toggleLabel", {
              category: t("categories.functional.name"),
            })}
          />

          <CategoryRow
            name={t("categories.statistics.name")}
            purpose={t("categories.statistics.purpose")}
            duration={t("categories.statistics.duration")}
            checked={draft.statistics}
            onToggle={() =>
              setDraft((prev) => ({ ...prev, statistics: !prev.statistics }))
            }
            toggleLabel={t("prefs.toggleLabel", {
              category: t("categories.statistics.name"),
            })}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-brand-black/15 pt-6 sm:flex-row sm:items-center">
          <ConsentButton onClick={refuseAll}>
            {t("prefs.refuseAll")}
          </ConsentButton>
          <ConsentButton onClick={acceptAll}>
            {t("prefs.acceptAll")}
          </ConsentButton>
          <Button variant="outline" onClick={() => save(draft)} className="w-full sm:w-auto">
            {t("prefs.save")}
          </Button>
        </div>

        <p className="mt-6 text-[0.78rem] leading-relaxed text-brand-black-80">
          {t("prefs.footnote")}{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-2 hover:text-brand-black"
          >
            {t("prefs.cookiePolicy")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function CategoryRow({
  name,
  purpose,
  duration,
  checked,
  onToggle,
  locked = false,
  lockedLabel,
  toggleLabel,
}: {
  name: string;
  purpose: string;
  duration: string;
  checked: boolean;
  onToggle?: () => void;
  locked?: boolean;
  lockedLabel?: string;
  toggleLabel?: string;
}) {
  return (
    <div className="border border-brand-black/15 bg-brand-wash/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-orech-ink">{name}</h3>
          <p className="mt-1.5 text-[0.85rem] leading-relaxed text-brand-black-80">
            {purpose}
          </p>
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brand-black-80">
            {duration}
          </p>
        </div>

        {locked ? (
          <span className="shrink-0 rounded-[3px] bg-brand-wash px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-brand-black-80">
            {lockedLabel}
          </span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={toggleLabel}
            onClick={onToggle}
            className={
              "relative h-7 w-12 shrink-0 rounded-[3px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted " +
              (checked ? "bg-brand-black" : "bg-brand-black-40")
            }
          >
            <span
              aria-hidden="true"
              className={
                "absolute top-1 h-5 w-5 rounded-[2px] bg-brand-white shadow transition-all " +
                (checked ? "left-6" : "left-1")
              }
            />
          </button>
        )}
      </div>
    </div>
  );
}

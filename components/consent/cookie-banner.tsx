"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
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
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-orech-line bg-orech-paper/95 shadow-[0_-8px_30px_rgba(10,10,10,0.08)] backdrop-blur-sm"
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
              className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed text-orech-mist"
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
                className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-medium text-orech-bronzeMuted underline underline-offset-4 transition-colors hover:text-orech-ink"
              >
                {t("banner.managePreferences")}
              </button>
            </div>

            <p className="mt-4 text-[0.78rem] text-orech-mist">
              <Link
                href="/cookies"
                className="underline underline-offset-2 hover:text-orech-bronzeMuted"
              >
                {t("banner.cookiePolicy")}
              </Link>
              <span aria-hidden="true"> · </span>
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-orech-bronzeMuted"
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
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-orech-ink px-6 py-2.5 text-sm font-semibold text-orech-paper transition-colors hover:bg-orech-bronzeMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted sm:w-auto sm:min-w-[11rem]"
    >
      {children}
    </button>
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-orech-line bg-orech-paper p-6 shadow-xl sm:rounded-2xl sm:p-8"
      >
        <p className="eyebrow">{t("prefs.eyebrow")}</p>
        <h2
          id="cookie-prefs-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-display text-2xl text-orech-ink outline-none md:text-3xl"
        >
          {t("prefs.title")}
        </h2>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-orech-mist">
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

        <div className="mt-8 flex flex-col gap-3 border-t border-orech-line pt-6 sm:flex-row sm:items-center">
          <ConsentButton onClick={refuseAll}>
            {t("prefs.refuseAll")}
          </ConsentButton>
          <ConsentButton onClick={acceptAll}>
            {t("prefs.acceptAll")}
          </ConsentButton>
          <button
            type="button"
            onClick={() => save(draft)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-orech-ink px-6 py-2.5 text-sm font-semibold text-orech-ink transition-colors hover:bg-orech-slate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted"
          >
            {t("prefs.save")}
          </button>
        </div>

        <p className="mt-6 text-[0.78rem] leading-relaxed text-orech-mist">
          {t("prefs.footnote")}{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-2 hover:text-orech-bronzeMuted"
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
    <div className="rounded-2xl border border-orech-line bg-orech-slate/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-orech-ink">{name}</h3>
          <p className="mt-1.5 text-[0.85rem] leading-relaxed text-orech-mist">
            {purpose}
          </p>
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-orech-mist">
            {duration}
          </p>
        </div>

        {locked ? (
          <span className="shrink-0 rounded-full bg-orech-slate px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-orech-mist">
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
              "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted " +
              (checked ? "bg-orech-bronzeMuted" : "bg-orech-mist/40")
            }
          >
            <span
              aria-hidden="true"
              className={
                "absolute top-1 h-5 w-5 rounded-full bg-orech-paper shadow transition-all " +
                (checked ? "left-6" : "left-1")
              }
            />
          </button>
        )}
      </div>
    </div>
  );
}

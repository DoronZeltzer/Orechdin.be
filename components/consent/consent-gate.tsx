"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useConsent } from "@/components/consent/consent-provider";
import { DENY_ALL, type OptionalCategory } from "@/lib/consent";

/**
 * Wraps third-party content that may not load before consent exists.
 *
 * This is the piece that makes the banner mean something. Under Article 129
 * of the Electronic Communications Act the breach happens the moment the
 * third party's script or frame is fetched — a banner that renders on top of
 * an already-loaded Google Maps frame is decoration, not compliance. So the
 * children are not rendered, not hidden: until consent is recorded the
 * embed's markup never reaches the DOM and no request to the third party is
 * made.
 *
 * The placeholder doubles as a per-embed consent point, which is the
 * granularity the GBA prefers: a visitor who wants the map can switch on that
 * one category from here without being pushed through "accept all".
 */
export function ConsentGate({
  category,
  title,
  description,
  children,
}: {
  category: OptionalCategory;
  /** Name of the specific embed, e.g. "Google Maps" — shown to the visitor. */
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("Consent");
  const { ready, allows, record, save } = useConsent();

  if (allows(category)) return <>{children}</>;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-orech-slate/40 p-8 text-center">
      <p className="eyebrow">{t("gate.eyebrow")}</p>
      <h3 className="font-display text-lg text-orech-ink">{title}</h3>
      <p className="max-w-md text-[0.85rem] leading-relaxed text-orech-mist">
        {description}
      </p>

      <button
        type="button"
        // Disabled only for the instant before the cookie has been read, so
        // that a visitor who already consented never sees a live "load" button
        // flash before their existing choice is applied.
        disabled={!ready}
        onClick={() =>
          save({
            ...(record ?? DENY_ALL),
            [category]: true,
          })
        }
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orech-ink px-6 py-2.5 text-sm font-semibold text-orech-paper transition-colors hover:bg-orech-bronzeMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orech-bronzeMuted disabled:opacity-50"
      >
        {t("gate.load")}
      </button>

      <p className="text-[0.75rem] text-orech-mist">
        <Link
          href="/cookies"
          className="underline underline-offset-2 hover:text-orech-bronzeMuted"
        >
          {t("gate.cookiePolicy")}
        </Link>
      </p>
    </div>
  );
}

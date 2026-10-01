"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-brand-wash p-8 text-center">
      <p className="eyebrow">{t("gate.eyebrow")}</p>
      <h3 className="font-display text-lg text-orech-ink">{title}</h3>
      <p className="max-w-md text-[0.85rem] leading-relaxed text-brand-black-80">
        {description}
      </p>

      <Button
        variant="dark"
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
      >
        {t("gate.load")}
      </Button>

      <p className="text-[0.75rem] text-brand-black-80">
        <Link
          href="/cookies"
          className="underline underline-offset-2 hover:text-brand-black"
        >
          {t("gate.cookiePolicy")}
        </Link>
      </p>
    </div>
  );
}

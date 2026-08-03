"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useNeo } from "@/components/neo/neo-context";
import { SITE } from "@/lib/site";

export function ContactMain() {
  const { setOpen: setNeoOpen } = useNeo();
  const t = useTranslations("ContactPage");
  const tDisclaimer = useTranslations("Disclaimer");

  return (
    <>
      <header className="mx-auto max-w-4xl px-4 md:px-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl text-orech-ink md:text-5xl">
          {t("headline")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-orech-mist font-light">
          {t("lead")}
        </p>
      </header>

      <div className="mx-auto mt-14 grid max-w-4xl gap-10 px-4 md:grid-cols-2 md:px-6">
        <address className="not-italic rounded-2xl border border-orech-line bg-orech-paper/50 p-8 text-sm leading-relaxed shadow-sm backdrop-blur-sm">
          <p className="font-display text-lg text-orech-ink">{SITE.shortName}</p>
          <p className="mt-4 text-orech-ink/80">
            {SITE.address.street}
            <br />
            {SITE.address.postal} {SITE.address.city}
            <br />
            {SITE.address.country}
          </p>
          <p className="mt-6">
            <a
              href={`tel:${SITE.phoneTel}`}
              className="text-base font-medium text-orech-bronze underline-offset-2 hover:text-orech-bronzeMuted transition"
            >
              {SITE.phoneDisplay}
            </a>
          </p>
          <p>
            <a
              href={`mailto:${SITE.email}`}
              className="font-medium text-orech-bronze underline-offset-2 hover:text-orech-bronzeMuted transition"
            >
              {SITE.email}
            </a>
          </p>
          <p className="mt-6 text-xs text-orech-ink/40">
            {SITE.copyrightEntity} · KBO {SITE.kbo}
          </p>
        </address>

        <div className="flex flex-col gap-6 p-8 bg-orech-slate/50 border border-orech-line rounded-2xl items-start justify-center backdrop-blur-sm shadow-sm transition hover:border-orech-bronze/40">
          <div>
            <h2 className="text-xl font-display text-orech-ink font-light tracking-tight mb-2">
              {t("neoTitle")}
            </h2>
            <p className="text-sm text-orech-mist max-w-md">{t("neoBody")}</p>
          </div>
          <button
            type="button"
            onClick={() => setNeoOpen(true)}
            className="mt-2 inline-flex items-center rounded-xl border border-orech-line bg-orech-paper px-6 py-3 text-sm font-medium text-orech-ink transition hover:border-orech-bronze/60 hover:text-orech-bronze"
          >
            {t("openNeo")}
          </button>
          <p className="text-xs leading-relaxed text-orech-ink/55 mt-2">
            {tDisclaimer("body")}{" "}
            <Link
              href="/privacy"
              className="font-medium text-orech-bronze underline-offset-2 hover:underline"
            >
              {t("privacyLink")}
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

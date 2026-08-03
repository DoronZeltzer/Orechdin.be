import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "OfficePage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description", { short: SITE.shortName, city: SITE.address.city }),
    path: "/office",
    locale: locale as "nl" | "en" | "fr",
  });
}

export default function OfficePage() {
  const t = useTranslations("OfficePage");
  const tDisclaimer = useTranslations("Disclaimer");
  const bulletsRaw = t.raw("bullets");
  const bullets = (Array.isArray(bulletsRaw) ? bulletsRaw : (typeof bulletsRaw === 'object' && bulletsRaw !== null ? Object.values(bulletsRaw) : [])) as string[];

  return (
    <main id="main-content" className="pb-24 pt-12 md:pt-20 bg-orech-paper min-h-screen text-orech-ink selection:bg-orech-bronze/30">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl text-orech-ink md:text-5xl">
          {t("headline")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-orech-mist font-light">
          {t("lead")}
        </p>
      </div>

      <section
        className="mx-auto mt-16 max-w-4xl px-4 md:px-6"
        aria-labelledby="approach-heading"
      >
        <h2
          id="approach-heading"
          className="font-display text-2xl text-orech-ink md:text-3xl"
        >
          {t("approachHeading")}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-orech-ink/80">
          {t("approachLead")}
        </p>
        <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-orech-ink/80">
          {bullets.map((b) => (
            <li key={b.slice(0, 32)}>{b}</li>
          ))}
        </ul>
        <p className="mt-6">
          <Link
            href="/services"
            className="inline-flex items-center text-sm font-medium text-orech-bronze underline-offset-4 hover:underline"
          >
            {t("publishedAreasLink")}
          </Link>
        </p>
      </section>

      <section
        className="mx-auto mt-16 max-w-4xl px-4 md:px-6"
        aria-labelledby="visit-heading"
      >
        <h2
          id="visit-heading"
          className="font-display text-2xl text-orech-ink md:text-3xl"
        >
          {t("visitHeading")}
        </h2>
        <div className="mt-8 rounded-2xl border border-orech-line bg-orech-slate/50 p-8 shadow-sm backdrop-blur-sm">
          <address className="not-italic leading-relaxed text-orech-ink/85">
            <p className="font-display text-lg text-orech-ink">{SITE.shortName}</p>
            <p className="mt-4">
              {SITE.address.street}
              <br />
              {SITE.address.postal} {SITE.address.city}, {SITE.address.country}
            </p>
          </address>
          <ul className="mt-6 space-y-3 text-orech-ink/90">
            <li>
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-orech-mist">
                {t("phoneLabel")}
              </span>
              <br />
              <a
                href={`tel:${SITE.phoneTel}`}
                className="text-lg font-medium text-orech-bronze underline-offset-2 hover:text-orech-bronzeMuted transition-colors"
              >
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-orech-mist">
                {t("emailLabel")}
              </span>
              <br />
              <a
                href={`mailto:${SITE.email}`}
                className="font-medium text-orech-bronze underline-offset-2 hover:text-orech-bronzeMuted transition-colors"
              >
                {SITE.email}
              </a>
            </li>
            <li className="pt-2 text-sm text-orech-mist">
              {SITE.copyrightEntity} · KBO {SITE.kbo} · {SITE.court}
            </li>
          </ul>
        </div>

        <div className="mt-8 rounded-2xl overflow-hidden border border-orech-line shadow-sm h-[300px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2498.5!2d4.4228!3d51.2118!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3f6f5c5b5e5e5%3A0x0!2sLange%20Herentalsestraat%20122%2C%202018%20Antwerpen!5e0!3m2!1sen!2sbe!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t("mapTitle", { short: SITE.shortName })}
          />
        </div>
      </section>

      <div className="mx-auto mt-12 flex max-w-4xl flex-wrap gap-4 px-4 md:px-6">
        <Link
          href="/lawyers"
          className="inline-flex min-h-11 items-center rounded-lg bg-orech-bronze px-8 py-3 text-sm font-medium uppercase tracking-wider text-white hover:bg-orech-bronzeMuted transition"
        >
          {t("ctaLawyers")}
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center rounded-lg border border-orech-line px-8 py-3 text-sm font-medium uppercase tracking-wider text-orech-ink hover:border-orech-bronze transition"
        >
          {t("ctaContact")}
        </Link>
      </div>

      <p className="mx-auto mt-16 max-w-4xl px-4 text-sm text-orech-mist/65 md:px-6">
        {tDisclaimer("body")}
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { ConsentControls } from "@/components/consent/consent-controls";
import {
  COOKIE_GROUPS,
  COOKIE_POLICY_UPDATED,
  COOKIE_POLICY_VERSION,
} from "@/lib/cookie-inventory";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CookiePage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/cookies",
    locale: locale as Locale,
  });
}

/**
 * The cookie policy — the "second layer" the Belgian DPA's guidance refers to,
 * reachable from the banner, the footer and every gated embed.
 *
 * It is a register rather than an essay: each entry names the cookie, who can
 * read it, how long it lives and why it exists, because that is the level of
 * detail the GBA checklist asks for. The withdrawal panel sits inside the
 * page so that changing your mind takes one click from the document that
 * explains what you agreed to.
 */
function CookiePolicyPageContent() {
  const t = useTranslations("CookiePage");
  const tConsent = useTranslations("Consent");

  return (
    <>
    <main
      id="main-content"
      className="min-h-screen bg-brand-white pb-24 text-brand-black selection:bg-brand-blue/40"
    >
      <article>
        <header className="surface-wash"><div className="mx-auto max-w-4xl px-6 py-12 md:py-16"><div className="max-w-3xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-3 text-4xl leading-tight md:text-5xl">
            {t("headline")}
          </h1>
          <p className="mt-2 text-xl font-bold text-brand-black-80">
            {SITE.legalName}
          </p>
          <p className="mt-6 leading-relaxed text-brand-black-80">
            {t("intro")}
          </p>
          <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-brand-black-80">
            {t("version", {
              version: COOKIE_POLICY_VERSION,
              date: COOKIE_POLICY_UPDATED,
            })}
          </p>
        </div></div></header>

        <div className="mx-auto mt-14 max-w-4xl space-y-12 px-6">
          <section aria-labelledby="summary-heading" className="rounded-2xl bg-brand-wash p-8">
            <h2 id="summary-heading" className="text-2xl md:text-3xl">
              {t("summaryHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">{t("summaryBody")}</p>
          </section>

          <section aria-labelledby="what-heading">
            <h2
              id="what-heading"
              className="text-2xl md:text-3xl"
            >
              {t("whatHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("whatBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("whatBody2")}
            </p>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("whatBody3")}
            </p>
          </section>

          <section aria-labelledby="basis-heading">
            <h2
              id="basis-heading"
              className="text-2xl md:text-3xl"
            >
              {t("basisHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("basisBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("basisBody2")}
            </p>
          </section>

          <section aria-labelledby="register-heading">
            <h2
              id="register-heading"
              className="text-2xl md:text-3xl"
            >
              {t("registerHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("registerIntro")}
            </p>

            <div className="mt-8 space-y-10">
              {COOKIE_GROUPS.map((group) => (
                <div key={group.id}>
                  <h3 className="text-xl">
                    {tConsent(`categories.${group.id}.name`)}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-brand-black-80">
                    {tConsent(`categories.${group.id}.purpose`)}
                  </p>
                  <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brand-black-80">
                    {group.category === null
                      ? t("noConsentNeeded")
                      : t("consentNeeded")}
                  </p>

                  {group.entries.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-brand-black/20 bg-brand-wash/60 p-5 text-[0.9rem] leading-relaxed text-brand-black-80">
                      {t("emptyCategory")}
                    </p>
                  ) : (
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-brand-black/20">
                      <table className="w-full min-w-[36rem] border-collapse text-start text-[0.85rem]">
                        <thead className="bg-brand-wash">
                          <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">
                              {t("table.name")}
                            </th>
                            <th scope="col" className="px-4 py-3 font-semibold">
                              {t("table.provider")}
                            </th>
                            <th scope="col" className="px-4 py-3 font-semibold">
                              {t("table.purpose")}
                            </th>
                            <th scope="col" className="px-4 py-3 font-semibold">
                              {t("table.duration")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((entry) => (
                            <tr
                              key={entry.id}
                              className="border-t border-brand-black/20 align-top"
                            >
                              <td className="px-4 py-3">
                                <span className="font-mono text-[0.78rem] text-brand-black">
                                  {entry.name}
                                </span>
                                <span className="mt-1 block font-mono text-[0.62rem] uppercase tracking-[0.12em] text-brand-black-80">
                                  {t(`kind.${entry.kind}`)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-brand-black-80">
                                {entry.provider}
                              </td>
                              <td className="px-4 py-3 text-brand-black-80">
                                {t(`entries.${entry.id}.purpose`)}
                              </td>
                              <td className="px-4 py-3 text-brand-black-80">
                                {t(`entries.${entry.id}.duration`)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="third-party-heading">
            <h2
              id="third-party-heading"
              className="text-2xl md:text-3xl"
            >
              {t("thirdPartyHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("thirdPartyBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("thirdPartyBody2")}{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline decoration-brand-black decoration-1 underline-offset-4"
              >
                {t("thirdPartyGoogleLink")}
              </a>
              .
            </p>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("linksBody")}
            </p>
          </section>

          <section aria-labelledby="secrecy-heading">
            <h2
              id="secrecy-heading"
              className="text-2xl md:text-3xl"
            >
              {t("secrecyHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("secrecyBody")}
            </p>
          </section>

          <ConsentControls />

          <section aria-labelledby="browser-heading">
            <h2
              id="browser-heading"
              className="text-2xl md:text-3xl"
            >
              {t("browserHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("browserBody")}
            </p>
          </section>

          <section aria-labelledby="complaint-heading">
            <h2
              id="complaint-heading"
              className="text-2xl md:text-3xl"
            >
              {t("complaintHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("complaintBody1", { name: SITE.dpo.name })}{" "}
              <a
                href={`mailto:${SITE.dpo.email}`}
                className="font-bold underline decoration-brand-black decoration-1 underline-offset-4"
              >
                {SITE.dpo.email}
              </a>
              .
            </p>
            <p className="mt-4 leading-relaxed text-brand-black-80">
              {t("complaintBody2")}{" "}
              <a
                href="https://www.gegevensbeschermingsautoriteit.be"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline decoration-brand-black decoration-1 underline-offset-4"
              >
                gegevensbeschermingsautoriteit.be
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mx-auto mt-16 max-w-4xl border-t border-brand-black/10 px-6 pt-10">
          <p className="text-sm leading-relaxed text-brand-black-80">
            {t("closing")}
          </p>
          <p className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="inline-flex min-h-12 items-center rounded-lg border-2 border-brand-blue bg-brand-blue px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-brand-black shadow-sm transition hover:-translate-y-px hover:shadow-md"
            >
              {t("ctaPrivacy")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center rounded-lg border-2 border-brand-black-60 px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-brand-black transition hover:border-brand-black hover:bg-brand-wash"
            >
              {t("ctaContact")}
            </Link>
          </p>
        </footer>
      </article>
    </main>
    </>
  );
}

// The language is set from the address before the page renders, so every page can be generated ahead of time.
export default async function CookiePolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CookiePolicyPageContent />;
}

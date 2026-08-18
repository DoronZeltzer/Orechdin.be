import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { ConsentControls } from "@/components/consent/consent-controls";
import {
  COOKIE_GROUPS,
  COOKIE_POLICY_UPDATED,
  COOKIE_POLICY_VERSION,
} from "@/lib/cookie-inventory";

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
    locale: locale as "nl" | "en" | "fr",
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
export default function CookiePolicyPage() {
  const t = useTranslations("CookiePage");
  const tConsent = useTranslations("Consent");

  return (
    <main
      id="main-content"
      className="min-h-screen bg-orech-paper pb-24 pt-12 text-orech-ink selection:bg-orech-bronze/30 md:pt-20"
    >
      <article className="mx-auto max-w-4xl px-4 md:px-6">
        <header className="max-w-3xl border-b border-orech-line pb-10">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-orech-ink md:text-5xl">
            {t("headline")}
          </h1>
          <p className="mt-2 font-display text-xl text-orech-mist">
            {SITE.legalName}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-orech-mist">
            {t("intro")}
          </p>
          <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-orech-mist">
            {t("version", {
              version: COOKIE_POLICY_VERSION,
              date: COOKIE_POLICY_UPDATED,
            })}
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <section aria-labelledby="what-heading">
            <h2
              id="what-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("whatHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("whatBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("whatBody2")}
            </p>
          </section>

          <section aria-labelledby="basis-heading">
            <h2
              id="basis-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("basisHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("basisBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("basisBody2")}
            </p>
          </section>

          <section aria-labelledby="register-heading">
            <h2
              id="register-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("registerHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("registerIntro")}
            </p>

            <div className="mt-8 space-y-10">
              {COOKIE_GROUPS.map((group) => (
                <div key={group.id}>
                  <h3 className="font-display text-xl text-orech-ink">
                    {tConsent(`categories.${group.id}.name`)}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-orech-mist">
                    {tConsent(`categories.${group.id}.purpose`)}
                  </p>
                  <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-orech-mist">
                    {group.category === null
                      ? t("noConsentNeeded")
                      : t("consentNeeded")}
                  </p>

                  {group.entries.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-orech-line bg-orech-slate/20 p-5 text-[0.9rem] leading-relaxed text-orech-mist">
                      {t("emptyCategory")}
                    </p>
                  ) : (
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-orech-line">
                      <table className="w-full min-w-[36rem] border-collapse text-left text-[0.85rem]">
                        <thead className="bg-orech-slate/50">
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
                              className="border-t border-orech-line align-top"
                            >
                              <td className="px-4 py-3">
                                <span className="font-mono text-[0.78rem] text-orech-ink">
                                  {entry.name}
                                </span>
                                <span className="mt-1 block font-mono text-[0.62rem] uppercase tracking-[0.12em] text-orech-mist">
                                  {t(`kind.${entry.kind}`)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-orech-mist">
                                {entry.provider}
                              </td>
                              <td className="px-4 py-3 text-orech-ink/80">
                                {t(`entries.${entry.id}.purpose`)}
                              </td>
                              <td className="px-4 py-3 text-orech-mist">
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
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("thirdPartyHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("thirdPartyBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("thirdPartyBody2")}{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 hover:text-orech-ink"
              >
                {t("thirdPartyGoogleLink")}
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="secrecy-heading">
            <h2
              id="secrecy-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("secrecyHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("secrecyBody")}
            </p>
          </section>

          <ConsentControls />

          <section aria-labelledby="browser-heading">
            <h2
              id="browser-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("browserHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("browserBody")}
            </p>
          </section>

          <section aria-labelledby="complaint-heading">
            <h2
              id="complaint-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("complaintHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("complaintBody1", { name: SITE.dpo.name })}{" "}
              <a
                href={`mailto:${SITE.dpo.email}`}
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 hover:text-orech-ink"
              >
                {SITE.dpo.email}
              </a>
              .
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("complaintBody2")}{" "}
              <a
                href="https://www.gegevensbeschermingsautoriteit.be"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 hover:text-orech-ink"
              >
                gegevensbeschermingsautoriteit.be
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-orech-line pt-10">
          <p className="text-sm leading-relaxed text-orech-mist">
            {t("closing")}
          </p>
          <p className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center rounded-lg bg-orech-ink px-6 py-2.5 text-sm font-medium text-orech-paper transition hover:bg-orech-bronzeMuted"
            >
              {t("ctaPrivacy")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center rounded-lg border border-orech-ink px-6 py-2.5 text-sm font-medium text-orech-ink transition hover:bg-orech-slate"
            >
              {t("ctaContact")}
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

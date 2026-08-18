import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import {
  COOKIE_POLICY_UPDATED,
  COOKIE_POLICY_VERSION,
} from "@/lib/cookie-inventory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/privacy",
    locale: locale as "nl" | "en" | "fr",
  });
}

/**
 * Privacy statement for the website.
 *
 * Two bodies of rules meet on this page and they do not always point the same
 * way. The GDPR wants the firm to tell data subjects what it holds and to let
 * them see it; Article 458 of the Criminal Code binds an advocate to
 * professional secrecy, which can outrank a data subject's own request when
 * answering it would expose a third party's confidences. The page therefore
 * states the secrecy position explicitly instead of publishing the usual
 * unqualified "you have the right to access all your data" — a promise this
 * firm cannot always keep, and one the bar would not want it to make.
 *
 * Structure follows Articles 13-14 GDPR so the disclosures can be checked off
 * one by one: controller, purposes and legal bases, recipients, transfers,
 * retention, rights, complaint routes.
 */
export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");

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
          <p className="mt-4 text-sm leading-relaxed text-orech-mist">
            {t("scope")}{" "}
            <a
              href={SITE.livePrivacyUrl}
              className="font-medium text-orech-bronzeMuted underline underline-offset-2 transition-colors hover:text-orech-ink"
              rel="noopener noreferrer"
            >
              {t("officialPolicy")}
            </a>
            .
          </p>
          <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-orech-mist">
            {t("version", {
              version: COOKIE_POLICY_VERSION,
              date: COOKIE_POLICY_UPDATED,
            })}
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <Section id="controller" heading={t("controllerHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("controllerBody1", {
                kbo: SITE.kbo,
                court: SITE.court,
                street: SITE.address.street,
                postal: SITE.address.postal,
                city: SITE.address.city,
              })}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("controllerBody2", { name: SITE.dpo.name })}{" "}
              <a
                href={`mailto:${SITE.dpo.email}`}
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 transition-colors hover:text-orech-ink"
              >
                {SITE.dpo.email}
              </a>
              {t("controllerBody3", { phone: SITE.dpo.phoneDisplay })}
            </p>
          </Section>

          {/* The clause that distinguishes a law firm's statement from a
              generic one — placed early because it qualifies everything that
              follows, including the rights section. */}
          <Highlight heading={t("secrecyHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("secrecyBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("secrecyBody2")}
            </p>
          </Highlight>

          <Section id="data" heading={t("dataHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("dataIntro")}
            </p>
            <ul className="mt-4 space-y-3 leading-relaxed text-orech-ink/80">
              <Item label={t("dataVisitLabel")}>{t("dataVisitBody")}</Item>
              <Item label={t("dataContactLabel")}>{t("dataContactBody")}</Item>
              <Item label={t("dataAssistantLabel")}>
                {t("dataAssistantBody")}
              </Item>
              <Item label={t("dataAccountLabel")}>{t("dataAccountBody")}</Item>
              <Item label={t("dataClientLabel")}>{t("dataClientBody")}</Item>
            </ul>
          </Section>

          <Section id="purposes" heading={t("purposesHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("purposesIntro")}
            </p>
            <ul className="mt-4 space-y-3 leading-relaxed text-orech-ink/80">
              <Item label={t("basisContractLabel")}>
                {t("basisContractBody")}
              </Item>
              <Item label={t("basisLegalLabel")}>{t("basisLegalBody")}</Item>
              <Item label={t("basisInterestLabel")}>
                {t("basisInterestBody")}
              </Item>
              <Item label={t("basisConsentLabel")}>
                {t("basisConsentBody")}
              </Item>
              <Item label={t("basisSpecialLabel")}>
                {t("basisSpecialBody")}
              </Item>
            </ul>
          </Section>

          {/* An intake chat on a lawyer's site invites exactly the disclosure
              it is least equipped to receive, so the warning is stated here
              rather than buried in terms of use. */}
          <Highlight heading={t("assistantHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("assistantBody1")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("assistantBody2")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("assistantBody3")}
            </p>
          </Highlight>

          <Section id="cookies" heading={t("cookiesHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("cookiesBody")}{" "}
              <Link
                href="/cookies"
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 transition-colors hover:text-orech-ink"
              >
                {t("cookiesLink")}
              </Link>
              .
            </p>
          </Section>

          <Section id="recipients" heading={t("recipientsHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("recipientsBody1")}
            </p>
            <ul className="mt-4 space-y-3 leading-relaxed text-orech-ink/80">
              <Item label={t("recipientHostingLabel")}>
                {t("recipientHostingBody")}
              </Item>
              <Item label={t("recipientMailLabel")}>
                {t("recipientMailBody")}
              </Item>
              <Item label={t("recipientAiLabel")}>{t("recipientAiBody")}</Item>
              <Item label={t("recipientCounterpartLabel")}>
                {t("recipientCounterpartBody")}
              </Item>
            </ul>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("recipientsBody2")}
            </p>
          </Section>

          <Section id="transfers" heading={t("transfersHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("transfersBody")}
            </p>
          </Section>

          <Highlight heading={t("retentionHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("retentionIntro")}
            </p>
            <ul className="mt-4 space-y-3 leading-relaxed text-orech-ink/80">
              <Item label={t("retentionFilesLabel")}>
                {t("retentionFilesBody")}
              </Item>
              <Item label={t("retentionAccountingLabel")}>
                {t("retentionAccountingBody")}
              </Item>
              <Item label={t("retentionEnquiryLabel")}>
                {t("retentionEnquiryBody")}
              </Item>
              <Item label={t("retentionConsentLabel")}>
                {t("retentionConsentBody")}
              </Item>
            </ul>
          </Highlight>

          <Section id="security" heading={t("securityHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("securityBody")}
            </p>
          </Section>

          <Section id="automated" heading={t("automatedHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("automatedBody")}
            </p>
          </Section>

          <Section id="rights" heading={t("rightsHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("rightsIntro")}
            </p>
            <ul className="mt-4 space-y-3 leading-relaxed text-orech-ink/80">
              <Item label={t("rightAccessLabel")}>{t("rightAccessBody")}</Item>
              <Item label={t("rightRectifyLabel")}>
                {t("rightRectifyBody")}
              </Item>
              <Item label={t("rightEraseLabel")}>{t("rightEraseBody")}</Item>
              <Item label={t("rightRestrictLabel")}>
                {t("rightRestrictBody")}
              </Item>
              <Item label={t("rightPortabilityLabel")}>
                {t("rightPortabilityBody")}
              </Item>
              <Item label={t("rightObjectLabel")}>{t("rightObjectBody")}</Item>
              <Item label={t("rightWithdrawLabel")}>
                {t("rightWithdrawBody")}
              </Item>
            </ul>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("rightsHow")}{" "}
              <a
                href={`mailto:${SITE.dpo.email}`}
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 transition-colors hover:text-orech-ink"
              >
                {SITE.dpo.email}
              </a>
              {t("rightsHowSuffix")}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("rightsLimit")}
            </p>
          </Section>

          <Section id="complaints" heading={t("complaintsHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("complaintsBody1")}
            </p>
            <address className="mt-4 not-italic leading-relaxed text-orech-ink/80">
              {t("dpaName")}
              <br />
              Drukpersstraat 35, 1000 Brussel
              <br />
              <a
                href="https://www.gegevensbeschermingsautoriteit.be"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orech-bronzeMuted underline underline-offset-2 transition-colors hover:text-orech-ink"
              >
                gegevensbeschermingsautoriteit.be
              </a>
            </address>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("complaintsBody2")}
            </p>
          </Section>

          <Section id="changes" heading={t("changesHeading")}>
            <p className="leading-relaxed text-orech-ink/80">
              {t("changesBody")}
            </p>
          </Section>
        </div>

        <footer className="mt-16 border-t border-orech-line pt-10">
          <p className="text-sm leading-relaxed text-orech-mist">
            {t("supportNote")}
          </p>
          <p className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center rounded-lg bg-orech-ink px-6 py-2.5 text-sm font-medium text-orech-paper transition hover:bg-orech-bronzeMuted"
            >
              {t("ctaContact")}
            </Link>
            <Link
              href="/cookies"
              className="inline-flex min-h-11 items-center rounded-lg border border-orech-ink px-6 py-2.5 text-sm font-medium text-orech-ink transition hover:bg-orech-slate"
            >
              {t("ctaCookies")}
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2
        id={`${id}-heading`}
        className="font-display text-2xl text-orech-ink md:text-3xl"
      >
        {heading}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A section the visitor should not skim past — secrecy, retention, the AI. */
function Highlight({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-orech-line bg-orech-slate/50 p-8 shadow-sm">
      <h2 className="font-display text-2xl text-orech-ink md:text-3xl">
        {heading}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <span className="font-semibold text-orech-ink">{label}</span>{" "}
      <span>{children}</span>
    </li>
  );
}

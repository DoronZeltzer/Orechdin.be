import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { HOSTED_AT_EASYHOST, SITE } from "@/lib/site";
import { PRIVACY_STATEMENT_UPDATED, PRIVACY_STATEMENT_VERSION } from "@/lib/cookie-inventory";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/privacy",
    locale: locale as Locale,
  });
}

/**
 * Privacy statement: one statement for the website AND for the office's client matters.
 *
 * Two bodies of rules meet here and do not always point the same way. The GDPR wants the
 * firm to tell people what it holds and to let them see it; Article 458 of the Criminal Code
 * binds an advocate to professional secrecy, which can outrank a person's own request when
 * answering it would expose someone else's confidences. The page says so openly instead of
 * promising "access to all your data", which the firm cannot always give.
 *
 * Order follows Articles 13 and 14 GDPR so each disclosure can be ticked off: controller,
 * whose data and from where, what data, purposes and legal bases, recipients, transfers,
 * retention, security, rights, complaints. Wording of the statement lives in
 * messages/en.json (PrivacyPage).
 */
function PrivacyPageContent() {
  const t = useTranslations("PrivacyPage");

  // The statement names the host that really serves the site (see HOSTED_AT_EASYHOST in lib/site.ts).
  const hostSuffix = HOSTED_AT_EASYHOST ? "Easyhost" : "";
  const items = (...keys: string[]) =>
    keys.map((k) => (
      <Item key={k} label={t(`${k}Label`)}>
        {t(`${k}Body${k === "recipientHosting" ? hostSuffix : ""}`)}
      </Item>
    ));

  return (
    <>
      <main id="main-content" className="min-h-screen bg-brand-white pb-24 text-brand-black selection:bg-brand-blue/40">
        <article>
          <header className="surface-wash">
            <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
              <div className="max-w-3xl">
                <p className="eyebrow">{t("eyebrow")}</p>
                <h1 className="mt-3 text-4xl leading-tight md:text-5xl">{t("headline")}</h1>
                <p className="mt-2 text-xl font-bold text-brand-black-80">{SITE.legalName}</p>
                <p className="mt-6 leading-relaxed text-brand-black-80">{t("intro")}</p>
                <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                  {t("version", { version: PRIVACY_STATEMENT_VERSION, date: PRIVACY_STATEMENT_UPDATED })}
                </p>
              </div>
            </div>
          </header>

          <div className="mx-auto mt-14 max-w-4xl space-y-12 px-6">
            <Section id="controller" heading={t("controllerHeading")}>
              <P>
                {t("controllerBody1", {
                  name: SITE.legalName,
                  kbo: SITE.kbo,
                  court: SITE.court,
                  street: SITE.address.street,
                  postal: SITE.address.postal,
                  city: SITE.address.city,
                })}
              </P>
              <P>
                {t("controllerBody2", { name: SITE.dpo.name })} <a className={LINK} href={`mailto:${SITE.dpo.email}`}>{SITE.dpo.email}</a>
                {t("controllerBody3", { phone: SITE.dpo.phoneDisplay })}
              </P>
            </Section>

            {/* The clause that distinguishes a law firm's statement from a generic one. It is
                placed early because it qualifies everything after it, including the rights. */}
            <Highlight id="secrecy" heading={t("secrecyHeading")}>
              <P>{t("secrecyBody1")}</P>
              <P>{t("secrecyBody2")}</P>
              <P>{t("secrecyBody3")}</P>
            </Highlight>

            <Section id="who" heading={t("whoHeading")}>
              <P first>{t("whoIntro")}</P>
              <List>{items("whoVisitors", "whoEnquirers", "whoClients", "whoOthers")}</List>
              <P>{t("whoSources")}</P>
            </Section>

            <Section id="data" heading={t("dataHeading")}>
              <P first>{t("dataIntro")}</P>
              <List>{items("dataVisit", "dataContact", "dataWhatsapp", "dataClient", "dataOthers", "dataSpecial")}</List>
            </Section>

            <Section id="purposes" heading={t("purposesHeading")}>
              <P first>{t("purposesIntro")}</P>
              <List>{items("basisContract", "basisLegal", "basisInterest", "basisConsent", "basisSpecial")}</List>
            </Section>

            <Section id="cookies" heading={t("cookiesHeading")}>
              <P first>
                {t("cookiesBody")}{" "}
                <Link href="/cookies" className={LINK}>
                  {t("cookiesLink")}
                </Link>
                .
              </P>
            </Section>

            <Section id="marketing" heading={t("marketingHeading")}>
              <P first>{t("marketingBody")}</P>
            </Section>

            <Section id="recipients" heading={t("recipientsHeading")}>
              <P first>{t("recipientsBody1")}</P>
              <List>{items("recipientHosting", "recipientMail", "recipientProviders", "recipientCounterpart")}</List>
              <P>{t("recipientsBody2")}</P>
            </Section>

            <Section id="transfers" heading={t("transfersHeading")}>
              <P first>{t(`transfersBody${hostSuffix}`)}</P>
            </Section>

            <Highlight id="retention" heading={t("retentionHeading")}>
              <P first>{t("retentionIntro")}</P>
              <List>{items("retentionFiles", "retentionAccounting", "retentionEnquiry", "retentionConsent")}</List>
            </Highlight>

            <Section id="security" heading={t("securityHeading")}>
              <P first>{t("securityBody")}</P>
            </Section>

            <Section id="automated" heading={t("automatedHeading")}>
              <P first>{t("automatedBody")}</P>
            </Section>

            <Section id="rights" heading={t("rightsHeading")}>
              <P first>{t("rightsIntro")}</P>
              <List>{items("rightAccess", "rightRectify", "rightErase", "rightRestrict", "rightPortability", "rightObject", "rightWithdraw")}</List>
              <P>
                {t("rightsHow")} <a className={LINK} href={`mailto:${SITE.dpo.email}`}>{SITE.dpo.email}</a>
                {t("rightsHowSuffix")}
              </P>
              <P>{t("rightsLimit")}</P>
            </Section>

            <Section id="complaints" heading={t("complaintsHeading")}>
              <P first>{t("complaintsBody1")}</P>
              <address className="mt-4 not-italic leading-relaxed text-brand-black-80">
                {t("dpaName")}
                <br />
                <bdi dir="ltr">{t("dpaAddress")}</bdi>
                <br />
                <bdi dir="ltr">{t("dpaPhone")}</bdi>
                <br />
                <a className={LINK} href={`mailto:${t("dpaEmail")}`}>
                  <bdi dir="ltr">{t("dpaEmail")}</bdi>
                </a>
                <br />
                <a className={LINK} href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer">
                  <bdi dir="ltr">gegevensbeschermingsautoriteit.be</bdi>
                </a>
              </address>
              <P>{t("complaintsBody2")}</P>
            </Section>

            <Section id="changes" heading={t("changesHeading")}>
              <P first>{t("changesBody")}</P>
            </Section>
          </div>

          <footer className="mx-auto mt-16 max-w-4xl border-t border-brand-black/10 px-6 pt-10">
            <p className="text-sm leading-relaxed text-brand-black-80">{t("supportNote")}</p>
            <p className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-brand-blue bg-brand-blue px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-brand-black shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                {t("ctaContact")}
              </Link>
              <Link
                href="/cookies"
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-brand-black-60 px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-brand-black transition hover:border-brand-black hover:bg-brand-wash"
              >
                {t("ctaCookies")}
              </Link>
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}

const LINK = "font-bold underline decoration-brand-black decoration-1 underline-offset-4";

function Section({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className="text-2xl md:text-3xl">
        {heading}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A section the visitor should not skim past: secrecy and retention. */
function Highlight({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 rounded-2xl bg-brand-wash p-8">
      <h2 id={`${id}-heading`} className="text-2xl md:text-3xl">
        {heading}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function P({ children, first = false }: { children: ReactNode; first?: boolean }) {
  return <p className={`${first ? "" : "mt-4 "}leading-relaxed text-brand-black-80`}>{children}</p>;
}

function List({ children }: { children: ReactNode }) {
  return <ul className="mt-4 space-y-3 leading-relaxed text-brand-black-80">{children}</ul>;
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li>
      <span className="font-bold text-brand-black">{label}</span> <span>{children}</span>
    </li>
  );
}

// The language is set from the address before the page renders, so every page can be generated ahead of time.
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyPageContent />;
}

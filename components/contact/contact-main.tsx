import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { PageHeading } from "@/components/ui/headings";
import { ContactForm } from "@/components/contact/contact-form";

/**
 * The contact page: the form on the left, the office's details on the right.
 *
 * The details sit on a black card so the page has one clear second focal point
 * next to the form. Every piece of content from the earlier page is kept: the
 * address, phone, email, company number, the disclaimer and the privacy link.
 */
export function ContactMain() {
  const t = useTranslations("ContactPage");
  const tDisclaimer = useTranslations("Disclaimer");

  const link =
    "font-bold underline decoration-brand-blue decoration-2 underline-offset-4 transition-colors hover:bg-brand-blue hover:text-brand-black";

  return (
    <>
      <SectionShell background="wash" className="py-14 lg:py-20">
        <PageHeading eyebrow={t("eyebrow")} title={t("headline")} lead={t("lead")} />
      </SectionShell>

      <SectionShell background="default">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3">
            <h2 className="text-2xl sm:text-3xl">{t("form.title")}</h2>
            <p className="mt-3 mb-8 max-w-xl text-lg text-brand-black-60">{t("form.intro")}</p>
            <ContactForm />
          </div>

          <aside className="lg:col-span-2">
            <div className="border-t-[6px] border-brand-blue bg-brand-black p-8 text-brand-white sm:p-10">
              <address className="not-italic">
                <p className="text-xl font-extrabold">{SITE.shortName}</p>
                <p className="mt-4 leading-relaxed text-brand-white/85">
                  {SITE.address.street}
                  <br />
                  {SITE.address.postal} {SITE.address.city}
                  <br />
                  {SITE.address.country}
                </p>
                <p className="mt-6 text-lg">
                  <a href={`tel:${SITE.phoneTel}`} className={link}>
                    {SITE.phoneDisplay}
                  </a>
                </p>
                <p className="mt-2">
                  <a href={`mailto:${SITE.email}`} className={link}>
                    {SITE.email}
                  </a>
                </p>
              </address>
              <p className="mt-8 border-t border-brand-white/25 pt-5 text-xs uppercase tracking-[0.14em] text-brand-white/60">
                {SITE.copyrightEntity} · KBO {SITE.kbo}
              </p>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-brand-black-60">
              {tDisclaimer("body")}{" "}
              <Link href="/privacy" className="font-bold text-brand-black underline decoration-brand-blue decoration-2 underline-offset-4 hover:bg-brand-blue">
                {t("privacyLink")}
              </Link>
              .
            </p>
          </aside>
        </div>
      </SectionShell>
    </>
  );
}

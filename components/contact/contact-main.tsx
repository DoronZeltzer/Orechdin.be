import { Globe, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { SITE } from "@/lib/site";
import { ConsentGate } from "@/components/consent/consent-gate";
import { SectionShell } from "@/components/design-system/section-shell";
import { Button } from "@/components/ui/button";
import { ContactActions } from "@/components/ui/contact-actions";
import { PageHeading, SectionHeading } from "@/components/ui/headings";
import { ContactForm } from "@/components/contact/contact-form";

/**
 * Contact: the introduction and the four actions, the contact details, the
 * office visits (with the map behind its consent gate), then the enquiry form.
 *
 * On a phone the telephone number, the email address and the street address are
 * all links: they dial, write and open directions. Nothing is hidden.
 */
export function ContactMain() {
  const t = useTranslations("ContactPage");

  const link =
    "font-bold underline decoration-brand-black decoration-1 underline-offset-4 transition-colors hover:bg-brand-white";

  return (
    <>
      <SectionShell background="wash" className="py-12 sm:py-14 lg:py-20">
        <PageHeading title={t("title")} lead={t("intro.p1")} />
      </SectionShell>

      <SectionShell background="default">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3">
            <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-brand-black-80">
              <p>{t("intro.p2")}</p>
              <p>{t("intro.p3")}</p>
            </div>
            <ContactActions include={["call", "whatsapp", "email", "enquiry"]} className="mt-8" />
          </div>

          <aside className="lg:col-span-2" aria-label={t("details.eyebrow")}>
            <div className="rounded-2xl bg-brand-blue p-8 text-brand-black sm:p-10">
              <address className="not-italic">
                <p className="text-xl font-extrabold">{SITE.title}</p>
                <p className="mt-1 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-black-80">{SITE.shortName}</p>
                <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" className={`mt-5 flex items-start gap-3 ${link}`}>
                  <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                  <span>
                    {SITE.address.street}
                    <br />
                    {SITE.address.postal} {SITE.address.city}, {SITE.address.country}
                  </span>
                </a>
                <ul className="mt-5 space-y-3 text-lg">
                  <li className="flex items-start gap-3">
                    <Phone className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                    <a href={`tel:${SITE.phoneTel}`} className={link}>
                      {SITE.phoneDisplay}
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                    <a href={`mailto:${SITE.email}`} className={link}>
                      {SITE.email}
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Globe className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                    <a href={`https://${SITE.website}`} target="_blank" rel="noopener noreferrer" className={link}>
                      {SITE.website}
                    </a>
                  </li>
                </ul>
              </address>
            </div>
          </aside>
        </div>
      </SectionShell>

      {/* Office visits, with directions as a plain link and the map behind consent. */}
      <SectionShell background="wash" id="visit">
        <SectionHeading eyebrow={t("visits.eyebrow")} title={t("visits.title")} lead={t("visits.body")} />
        <p className="mt-6 text-lg">
          {SITE.address.street}
          <br />
          {SITE.address.postal} {SITE.address.city}, {SITE.address.country}
        </p>
        <div className="mt-6">
          <Button href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Navigation className="h-4 w-4 shrink-0" aria-hidden />
            {t("visits.directions")}
          </Button>
        </div>

        {/* The map is third-party content: loading the frame hands the visitor's
            IP and a Google cookie to Google before they have said anything, so it
            stays behind a consent gate until the visitor allows it. */}
        <div className="mt-10 h-[340px] overflow-hidden rounded-2xl border border-brand-black/10 shadow-hairline sm:h-[420px]">
          <ConsentGate category="functional" title={t("mapConsentTitle")} description={t("mapConsentBody")}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2498.5!2d4.4228!3d51.2118!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3f6f5c5b5e5e5%3A0x0!2sLange%20Herentalsestraat%20122%2C%202018%20Antwerpen!5e0!3m2!1sen!2sbe!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("mapTitle")}
            />
          </ConsentGate>
        </div>
      </SectionShell>

      {/* The enquiry form. The page ends on white. */}
      <SectionShell background="default" id="enquiry" className="scroll-mt-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl leading-tight sm:text-4xl">{t("enquiry.title")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-brand-black-80">{t("enquiry.intro")}</p>
          <div className="mt-8">
            <ContactForm />
          </div>
          <p className="mt-12 text-xl font-bold leading-snug">{t("closing")}</p>
        </div>
      </SectionShell>
    </>
  );
}

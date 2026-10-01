import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { ConsentGate } from "@/components/consent/consent-gate";
import { SectionShell } from "@/components/design-system/section-shell";
import { Button } from "@/components/ui/button";
import { PageHeading, SectionHeading } from "@/components/ui/headings";

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
  const bulletsRaw = t.raw("bullets");
  const bullets = (
    Array.isArray(bulletsRaw)
      ? bulletsRaw
      : typeof bulletsRaw === "object" && bulletsRaw !== null
        ? Object.values(bulletsRaw)
        : []
  ) as string[];

  const link =
    "font-bold underline decoration-brand-black decoration-1 underline-offset-4 transition-colors hover:bg-brand-white";

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-14 lg:py-20">
        <PageHeading eyebrow={t("eyebrow")} title={t("headline")} lead={t("lead")} />
      </SectionShell>

      <SectionShell background="default">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <section className="lg:col-span-7" aria-labelledby="approach-heading">
            <SectionHeading title={t("approachHeading")} lead={t("approachLead")} />
            <ul className="mt-8 max-w-2xl space-y-4 text-lg">
              {bullets.map((b) => (
                <li key={b.slice(0, 32)} className="flex items-start gap-4 text-brand-black-80">
                  <span aria-hidden className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/services" variant="outline" arrow>
                {t("publishedAreasLink").replace(/\s*→\s*$/, "")}
              </Button>
            </div>
          </section>

          <section className="lg:col-span-5" aria-labelledby="visit-heading">
            <div className="rounded-2xl bg-brand-blue p-8 text-brand-black sm:p-10">
              <h2 id="visit-heading" className="text-2xl">
                {t("visitHeading")}
              </h2>
              <address className="mt-6 flex items-start gap-4 not-italic leading-relaxed text-brand-black-80">
                <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-bold text-brand-black">{SITE.shortName}</p>
                  <p className="mt-1">
                    {SITE.address.street}
                    <br />
                    {SITE.address.postal} {SITE.address.city}, {SITE.address.country}
                  </p>
                </div>
              </address>
              <ul className="mt-6 space-y-5">
                <li className="flex items-start gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                      {t("phoneLabel")}
                    </p>
                    <a href={`tel:${SITE.phoneTel}`} className={`text-lg ${link}`}>
                      {SITE.phoneDisplay}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Mail className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                      {t("emailLabel")}
                    </p>
                    <a href={`mailto:${SITE.email}`} className={`text-lg ${link}`}>
                      {SITE.email}
                    </a>
                  </div>
                </li>
              </ul>
              <p className="mt-8 border-t border-brand-black/20 pt-5 text-xs uppercase tracking-[0.14em] text-brand-black-80">
                {SITE.copyrightEntity} · KBO {SITE.kbo} · {SITE.court}
              </p>
            </div>
          </section>
        </div>

        {/* The map is third-party content: loading the frame hands the
            visitor's IP and a Google cookie to Google before they have said
            anything. It therefore stays behind a consent gate, which renders
            a placeholder until the `functional` category is granted. */}
        <div className="mt-14 h-[360px] overflow-hidden rounded-2xl border border-brand-black/10 shadow-hairline sm:h-[420px]">
          <ConsentGate category="functional" title={t("mapConsentTitle")} description={t("mapConsentBody")}>
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
          </ConsentGate>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button href="/lawyers" arrow>
            {t("ctaLawyers")}
          </Button>
          <Button href="/contact" variant="outline">
            {t("ctaContact")}
          </Button>
        </div>
      </SectionShell>
    </main>
  );
}

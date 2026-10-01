import Image from "next/image";
import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { LAWYERS, MEDIA } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { Button } from "@/components/ui/button";
import { PageHeading, SectionHeading } from "@/components/ui/headings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LawyersPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/lawyers",
    locale: locale as "nl" | "en" | "fr",
  });
}

export default function LawyersPage() {
  const t = useTranslations("LawyersPage");
  const tCommon = useTranslations("Common");

  const link =
    "font-bold underline decoration-brand-black decoration-1 underline-offset-4 transition-colors hover:bg-brand-blue";

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-14 lg:py-20">
        <PageHeading eyebrow={t("eyebrow")} title={t("headline")} lead={t("lead")} />
      </SectionShell>

      <SectionShell background="default">
        <SectionHeading title={t("profilesHeading")} lead={t("profilesIntro")} />

        <div className="mt-14 space-y-16">
          {LAWYERS.map((lawyer, i) => (
            <article
              key={lawyer.slug}
              id={lawyer.slug}
              className="grid scroll-mt-28 gap-10 border-t border-brand-black/10 pt-14 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:gap-14"
            >
              <div className="lg:col-span-4">
                <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl bg-brand-wash shadow-hairline lg:max-w-none">
                  <Image
                    src={i === 0 ? MEDIA.nirPhoto : MEDIA.deborahPhoto}
                    alt={lawyer.name}
                    fill
                    quality={90}
                    priority={i === 0}
                    className="object-cover object-top"
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 384px, 100vw"
                  />
                </div>
              </div>

              <div className="lg:col-span-8">
                <h2 className="text-3xl sm:text-4xl">{lawyer.name}</h2>
                <p className="mt-2 text-lg font-bold text-brand-black-80">{lawyer.role}</p>
                <p className="mt-4 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                  {t("biographyNote")}
                </p>

                <div className="mt-6 max-w-3xl space-y-5 text-lg leading-relaxed text-brand-black-80">
                  {lawyer.bio.map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                </div>

                <dl className="mt-8 grid max-w-3xl gap-6 rounded-2xl bg-brand-wash p-6 sm:grid-cols-2 sm:p-8">
                  <div className="flex items-start gap-4">
                    <Phone className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                    <div>
                      <dt className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                        {tCommon("mobileLabel")}
                      </dt>
                      <dd className="mt-1 text-lg">
                        <a href={`tel:${lawyer.mobileTel}`} className={link}>
                          {lawyer.mobileDisplay}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                    <div>
                      <dt className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                        {tCommon("emailLabel")}
                      </dt>
                      <dd className="mt-1 text-lg">
                        <a href={`mailto:${lawyer.email}`} className={link}>
                          {lawyer.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Button href="/contact" arrow>
                    {t("ctaContactOffice")}
                  </Button>
                  <Button href="/services" variant="outline">
                    {t("ctaPracticeAreas")}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap gap-4 border-t border-brand-black/15 pt-12">
          <Button href="/contact" arrow>
            {t("footerCtaContact")}
          </Button>
          <Button href="/office" variant="outline">
            {t("footerCtaOffice")}
          </Button>
        </div>
      </SectionShell>
    </main>
  );
}

import type { Metadata } from "next";
import { Briefcase, Building2, Gavel, Scale, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { SectionShell } from "@/components/design-system/section-shell";
import { PageHeading } from "@/components/ui/headings";
import { IconTile } from "@/components/ui/icon-tile";
import { setRequestLocale } from "next-intl/server";

const AREA_ICONS = [Briefcase, Building2, Gavel, Scale, Users] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServicesPage.metadata" });
  return pageMetadata({ title: t("title"), description: t("description"), path: "/services", locale: locale as Locale });
}

function ServicesPageContent() {
  const t = useTranslations("ServicesPage");
  const areas = t.raw("areas") as { title: string; p1: string; p2: string }[];

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-12 sm:py-14 lg:py-20">
        <PageHeading title={t("title")} lead={t("intro.p1")} />
      </SectionShell>

      <SectionShell background="default" className="pb-4 lg:pb-6">
        <div className="max-w-3xl space-y-5 text-base leading-relaxed sm:text-lg text-brand-black-80">
          <p>{t("intro.p2")}</p>
          <p>{t("intro.p3")}</p>
        </div>
      </SectionShell>

      {/* The five areas stack vertically, one under the other, on every screen. */}
      <SectionShell background="default" className="pt-8 lg:pt-10">
        <div className="space-y-6">
          {areas.map((a, i) => (
            <article key={a.title} className="rounded-2xl border border-brand-black/10 bg-brand-wash/50 p-6 sm:p-8 lg:p-10">
              <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-4">
                  <IconTile icon={AREA_ICONS[i] ?? Scale} />
                  <h2 className="mt-5 text-2xl leading-snug">{a.title}</h2>
                </div>
                <div className="space-y-4 leading-relaxed text-brand-black-80 lg:col-span-8">
                  <p className="text-lg text-brand-black">{a.p1}</p>
                  <p>{a.p2}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* The general statement closes the page, on the accent blue. */}
        <div className="mt-8 rounded-3xl bg-brand-blue p-8 sm:p-12">
          <p className="max-w-3xl text-xl font-bold leading-snug sm:text-2xl">{t("litigation")}</p>
        </div>
      </SectionShell>
    </main>
  );
}

// The language is set from the address before the page renders, so every page can be generated ahead of time.
export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServicesPageContent />;
}

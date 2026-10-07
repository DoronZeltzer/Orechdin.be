import type { Metadata } from "next";
import { Handshake, Compass, Scale, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { SectionShell } from "@/components/design-system/section-shell";
import { PageHeading, SectionHeading } from "@/components/ui/headings";
import { IconTile } from "@/components/ui/icon-tile";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "OfficePage.metadata" });
  return pageMetadata({ title: t("title"), description: t("description"), path: "/office", locale: locale as Locale });
}

const VALUE_ICONS = [Handshake, Scale, Compass, Users] as const;

function OfficePageContent() {
  const t = useTranslations("OfficePage");
  const values = t.raw("values.items") as { title: string; body: string }[];

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-12 sm:py-14 lg:py-20">
        <PageHeading title={t("title")} lead={t("intro.p1")} />
      </SectionShell>

      <SectionShell background="default">
        <div className="max-w-3xl space-y-5 text-base leading-relaxed sm:text-lg text-brand-black-80">
          <p>{t("intro.p2")}</p>
          <p>{t("intro.p3")}</p>
          <p>{t("intro.p4")}</p>
          <p>{t("intro.p5")}</p>
        </div>
      </SectionShell>

      <SectionShell background="wash">
        <SectionHeading title={t("values.eyebrow")} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <article key={v.title} className="rounded-2xl bg-brand-white p-8 shadow-hairline">
              <IconTile icon={VALUE_ICONS[i] ?? Scale} />
              <h3 className="mt-6 text-xl leading-snug">{v.title}</h3>
              <p className="mt-3 leading-relaxed text-brand-black-80">{v.body}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell background="default">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading title={t("direct.title")} />
          </div>
          <div className="space-y-5 text-base leading-relaxed sm:text-lg text-brand-black-80 lg:col-span-7">
            <p>{t("direct.p1")}</p>
            <p>{t("direct.p2")}</p>
            <p className="font-bold text-brand-black">{t("direct.p3")}</p>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}

// The language is set from the address before the page renders, so every page can be generated ahead of time.
export default async function OfficePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OfficePageContent />;
}

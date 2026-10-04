import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { PageHeading } from "@/components/ui/headings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LegalNotice.metadata" });
  return pageMetadata({ title: t("title"), description: t("description"), path: "/legal-notice", locale: locale as Locale });
}

/**
 * Legal notice. For now it carries only the company details the firm already
 * published on its previous site. The full legal notice and disclaimer are still
 * being finalised and are not written here: they are not to be copied from the
 * old documents.
 */
export default function LegalNoticePage() {
  const t = useTranslations("LegalNotice");

  const rows: [string, React.ReactNode][] = [
    [t("company"), `${SITE.legalName}`],
    [t("companyNumber"), SITE.kbo],
    [t("court"), SITE.court],
    [t("address"), SITE.address.singleLine],
    [t("email"), <a key="e" className="font-bold underline underline-offset-4" href={`mailto:${SITE.email}`}>{SITE.email}</a>],
    [t("phone"), <a key="p" className="font-bold underline underline-offset-4" href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>],
    [t("website"), SITE.website],
  ];

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-14 lg:py-20">
        <PageHeading title={t("title")} />
      </SectionShell>
      <SectionShell background="default">
        <dl className="grid max-w-3xl gap-x-10 gap-y-6 sm:grid-cols-[14rem_1fr]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">{label}</dt>
              <dd className="text-lg">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionShell>
    </main>
  );
}

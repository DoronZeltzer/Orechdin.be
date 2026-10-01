import type { Metadata } from "next";
import { Globe, ShieldAlert, Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/headings";
import { IconTile } from "@/components/ui/icon-tile";

const GROUP_ICONS = [Scale, Globe, ShieldAlert] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServicesPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/services",
    locale: locale as "nl" | "en" | "fr",
  });
}

/** Some translation entries arrive as arrays, some as keyed objects; accept both. */
function asList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") return Object.values(raw) as T[];
  return [];
}

export default function ServicesPage() {
  const t = useTranslations("ServicesPage");
  const groups = asList<{ title: string; intro: string; items: string[] }>(t.raw("groups"));

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-14 lg:py-20">
        <PageHeading eyebrow={t("eyebrow")} title={t("headline")} lead={t("lead", { short: SITE.shortName })} />
      </SectionShell>

      {/* The same card as the homepage's practice areas, so the two read as one. */}
      <SectionShell background="default">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => (
            <article
              key={g.title}
              className="flex flex-col border border-brand-black/15 bg-brand-white p-8 transition-colors duration-200 hover:border-brand-black"
            >
              <IconTile icon={GROUP_ICONS[i] ?? Scale} />
              <h2 className="mt-6 text-2xl leading-snug">{g.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-brand-black-80">{g.intro}</p>
              <ul className="mt-7 space-y-3 border-t border-brand-black/15 pt-6">
                {asList<string>(g.items).map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem]">
                    <span aria-hidden className="mt-[0.5em] h-2 w-2 shrink-0 bg-brand-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionShell>

      {/* A black panel on a white section: the page ends white so the footer's
          fade has white to start from. */}
      <SectionShell background="default" className="pt-0 lg:pt-0">
        <div className="bg-brand-black p-8 text-brand-white sm:p-12 lg:p-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl">{t("intlHeading")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-brand-white/80">{t("intlBody")}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/contact" arrow>
                {t("ctaContact")}
              </Button>
              <Button href="/lawyers" variant="outline-light">
                {t("ctaLawyerProfiles")}
              </Button>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}

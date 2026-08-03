import type { Metadata } from "next";
import { ArrowRight, Globe, ShieldAlert, Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";

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

export default function ServicesPage() {
  const t = useTranslations("ServicesPage");
  const tDisclaimer = useTranslations("Disclaimer");
  const groupsRaw = t.raw("groups");
  const groups = (Array.isArray(groupsRaw) ? groupsRaw : (typeof groupsRaw === 'object' && groupsRaw !== null ? Object.values(groupsRaw) : [])) as Array<{
    title: string;
    intro: string;
    items: string[];
  }>;

  return (
    <main id="main-content" className="bg-orech-paper min-h-screen text-orech-ink selection:bg-orech-bronze/30">
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 container relative z-10 text-center">
          <p className="eyebrow mb-6">{t("eyebrow")}</p>
          <h1 className="text-4xl lg:text-6xl font-display font-light tracking-tight text-orech-ink mb-8">
            {t("headline")}
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed text-orech-mist font-light">
            {t("lead", { short: SITE.shortName })}
          </p>
        </div>
      </section>

      <SectionShell background="default" className="pt-0 lg:pt-0">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groups.map((g, idx) => {
            const Icon = GROUP_ICONS[idx] ?? Scale;
            return (
              <div
                key={g.title}
                className="p-8 rounded-2xl bg-orech-slate/50 border border-orech-line relative overflow-hidden backdrop-blur-md flex flex-col items-start hover:border-orech-bronze/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-orech-paper border border-orech-line flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-orech-bronze" aria-hidden />
                </div>
                <h3 className="text-xl font-medium text-orech-ink mb-3 group-hover:text-orech-bronze transition-colors">
                  {g.title}
                </h3>
                <p className="text-orech-mist text-sm leading-relaxed flex-1 mb-8">
                  {g.intro}
                </p>
                <ul className="space-y-3 w-full border-t border-orech-line pt-6">
                  {((Array.isArray(g.items) ? g.items : (typeof g.items === 'object' && g.items !== null ? Object.values(g.items) : [])) as string[]).map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-orech-ink/80"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orech-bronze/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell background="elevated">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl lg:text-3xl font-display font-light text-orech-ink mb-6">
            {t("intlHeading")}
          </h2>
          <p className="text-orech-mist text-lg leading-relaxed font-light mb-8 max-w-3xl mx-auto">
            {t("intlBody")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8">
            <Link
              href="/contact"
              className="px-8 py-3 rounded-lg bg-orech-bronze hover:bg-orech-bronzeMuted text-white text-sm font-medium transition shadow-lg inline-flex items-center gap-2"
            >
              {t("ctaContact")} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link
              href="/lawyers"
              className="px-8 py-3 rounded-lg bg-transparent border border-orech-line hover:border-orech-bronze/50 text-orech-ink text-sm font-medium transition"
            >
              {t("ctaLawyerProfiles")}
            </Link>
          </div>
        </div>
      </SectionShell>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-xs leading-relaxed text-orech-mist/60 text-center">
          {tDisclaimer("body")}
        </p>
      </div>
    </main>
  );
}

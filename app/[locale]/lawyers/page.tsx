import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { LAWYERS, MEDIA } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { PageHeading } from "@/components/ui/headings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LawyersPage.metadata" });
  return pageMetadata({ title: t("title"), description: t("description"), path: "/lawyers", locale: locale as Locale });
}

type Profile = {
  name: string;
  role: string;
  paragraphs: string[];
  education?: string[];
  languages?: string[];
  areas?: string[];
};

export default function LawyersPage() {
  const t = useTranslations("LawyersPage");

  const profiles: Profile[] = [t.raw("nir") as Profile, t.raw("deborah") as Profile];
  const photos = [MEDIA.nirPhoto, MEDIA.deborahPhoto];

  const blocks: { key: "education" | "languages" | "areas"; label: string }[] = [
    { key: "education", label: t("blocks.education") },
    { key: "languages", label: t("blocks.languages") },
    { key: "areas", label: t("blocks.areas") },
  ];

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      <SectionShell background="wash" className="py-12 sm:py-14 lg:py-20">
        <PageHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("intro.p1")} />
      </SectionShell>

      <SectionShell background="default" className="pb-4 lg:pb-6">
        <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-brand-black-80">
          <p>{t("intro.p2")}</p>
          <p>{t("intro.p3")}</p>
        </div>
      </SectionShell>

      <SectionShell background="default" className="pt-8 lg:pt-10">
        <div className="space-y-16">
          {profiles.map((p, i) => (
            <article
              key={LAWYERS[i].slug}
              id={LAWYERS[i].slug}
              className="grid scroll-mt-28 gap-10 border-t border-brand-black/10 pt-14 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:gap-14"
            >
              <div className="lg:col-span-4">
                <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl bg-brand-wash shadow-hairline lg:max-w-none">
                  <Image
                    src={photos[i]}
                    alt={p.name}
                    fill
                    quality={90}
                    priority={i === 0}
                    className="object-cover object-top"
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 384px, 100vw"
                  />
                </div>
              </div>

              <div className="lg:col-span-8">
                <h2 className="text-3xl sm:text-4xl">{p.name}</h2>
                <p className="mt-2 text-lg font-bold text-brand-black-80">{p.role}</p>

                <div className="mt-6 max-w-3xl space-y-5 text-lg leading-relaxed text-brand-black-80">
                  {p.paragraphs.map((para) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
                </div>

                {/* Separate factual blocks. A block is shown only when there is
                    confirmed information for it; nothing is filled in. */}
                <div className="mt-8 grid max-w-3xl gap-6 rounded-2xl bg-brand-wash p-6 sm:p-8">
                  {blocks.map(({ key, label }) => {
                    const items = p[key];
                    if (!items || items.length === 0) return null;
                    return (
                      <section key={key}>
                        <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">{label}</h3>
                        <ul className="mt-3 space-y-2">
                          {items.map((item) => (
                            <li key={item} className="flex items-start gap-3">
                              <span aria-hidden className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
    </main>
  );
}

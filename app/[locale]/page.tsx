import type { Metadata } from "next";
import Image from "next/image";
import { Briefcase, Building2, Gavel, Scale, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { LAWYERS, MEDIA, SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { Button } from "@/components/ui/button";
import { ContactActions } from "@/components/ui/contact-actions";
import { PageHeading, SectionHeading } from "@/components/ui/headings";
import { IconTile } from "@/components/ui/icon-tile";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: "",
    absoluteTitle: true,
  });
}

/** One icon per area, in the order the areas are listed. */
const AREA_ICONS = [Briefcase, Building2, Gavel, Scale, Users] as const;

function HomePageContent() {
  const t = useTranslations("HomePage");
  const tLawyers = useTranslations("LawyersPage");

  const areas = t.raw("whatWeDo.items") as { title: string; body: string }[];
  const lawyerCards = [
    { ...LAWYERS[0], name: tLawyers("nir.name"), role: tLawyers("nir.role"), photo: MEDIA.nirPhoto },
    { ...LAWYERS[1], name: tLawyers("deborah.name"), role: tLawyers("deborah.role"), photo: MEDIA.deborahPhoto },
  ];

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      {/* ═════════════════════════════ HERO ═════════════════════════════
          Mobile first: logo (in the header), "Boutique Law Office", the headline,
          the short introduction and the contact buttons all sit on the first
          screen of a phone. The photograph and its soft wash are as before. */}
      <section className="relative flex items-center overflow-hidden sm:min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <Image
            src={MEDIA.heroBg}
            alt={t("hero.imageAlt")}
            fill
            priority
            quality={90}
            className="object-cover object-center [filter:saturate(0.62)_brightness(1.05)]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 via-brand-blue/10 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-white/95 via-brand-white/88 to-brand-white/75 sm:via-brand-white/80 sm:to-brand-white/40 rtl:bg-gradient-to-l" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-wide px-6 py-10 sm:px-10 sm:py-24 lg:px-16 lg:py-36">
          <div className="reveal max-w-2xl">
            <PageHeading
              title={t("hero.title")}
              lead={t("hero.intro")}
              className="max-w-none"
            />
            <ContactActions className="mt-8" />
            <p className="mt-7 max-w-xl text-lg font-bold leading-snug">{t("hero.supporting")}</p>
          </div>

          {/* The stamp, as before: a small caption over a very faint year. */}
          <div className="reveal reveal-delay-5 absolute bottom-16 end-10 hidden flex-col items-end gap-1 text-end lg:flex">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand-black-60">{t("hero.stamp")}</span>
            <span aria-hidden className="text-[3rem] font-light leading-none text-brand-blue/20">
              1999
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ PERSONAL APPROACH ═══════════════════════════ */}
      <SectionShell background="default" id="personal">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionHeading eyebrow={t("personal.eyebrow")} title={t("personal.title")} />
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-brand-black-80">
              <p>{t("personal.p1")}</p>
              <p>{t("personal.p2")}</p>
              <p>{t("personal.p3")}</p>
            </div>
          </div>

          <ul className="space-y-4 lg:col-span-5">
            {lawyerCards.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/lawyers#${l.slug}`}
                  className="group flex items-center gap-5 rounded-2xl bg-brand-wash/60 p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-hairlineLift"
                >
                  <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-wash">
                    <Image src={l.photo} alt="" fill quality={90} className="object-cover object-top" sizes="96px" />
                  </span>
                  <span>
                    <span className="block text-xl font-extrabold">{l.name}</span>
                    <span className="mt-0.5 block text-brand-black-80">{l.role}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ WHAT WE DO ═══════════════════════════ */}
      <SectionShell background="wash" id="what-we-do">
        <SectionHeading title={t("whatWeDo.title")} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a, i) => (
            <article key={a.title} className="rounded-2xl bg-brand-white p-8 shadow-hairline">
              <IconTile icon={AREA_ICONS[i] ?? Scale} />
              <h3 className="mt-6 text-xl leading-snug">{a.title}</h3>
              <p className="mt-3 leading-relaxed text-brand-black-80">{a.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Button href="/services" arrow className="w-full sm:w-auto">
            {t("whatWeDo.cta")}
          </Button>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ ADVICE ═══════════════════════════ */}
      <SectionShell background="default" id="advice">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading title={t("advice.title")} />
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-brand-black-80 lg:col-span-7">
            <p>{t("advice.p1")}</p>
            <p>{t("advice.p2")}</p>
          </div>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ CLIENTS ABROAD ═══════════════════════════ */}
      <SectionShell background="blue" id="abroad">
        <SectionHeading tone="blue" eyebrow={t("abroad.eyebrow")} title={t("abroad.title")} className="max-w-4xl" />
        <div className="mt-8 max-w-3xl space-y-5 text-lg leading-relaxed text-brand-black-80">
          <p>{t("abroad.p1")}</p>
          <p className="font-bold text-brand-black">{t("abroad.p2")}</p>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ CONTACT ═══════════════════════════
          The page ends on white (the footer fades from white into its blue). */}
      <SectionShell background="default" id="contact-cta">
        <div className="rounded-3xl bg-brand-wash p-8 sm:p-12 lg:p-16">
          <h2 className="text-3xl leading-tight sm:text-4xl lg:text-[2.6rem]">{t("contact.title")}</h2>
          <div className="mt-6 max-w-2xl space-y-4 text-lg leading-relaxed text-brand-black-80">
            <p>{t("contact.p1")}</p>
            <p>{t("contact.p2")}</p>
            <p>{t("contact.p3")}</p>
          </div>
          <ContactActions className="mt-9" />
        </div>
      </SectionShell>
    </main>
  );
}

// The language is set from the address before the page renders, so every page can be generated ahead of time.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomePageContent />;
}

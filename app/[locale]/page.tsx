import type { Metadata } from "next";
import Image from "next/image";
import { Building2, Mail, MapPin, Phone, Scale, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { LAWYERS, MEDIA, SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";
import { Button } from "@/components/ui/button";
import { PageHeading, SectionHeading } from "@/components/ui/headings";
import { IconTile } from "@/components/ui/icon-tile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as "nl" | "en" | "fr",
    path: "",
  });
}

/** Icons for the three practice groups, in the order they are published. */
const GROUP_ICONS = [Scale, Users, Building2] as const;

/** Some translation entries arrive as arrays, some as keyed objects; accept both. */
function asList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") return Object.values(raw) as T[];
  return [];
}

export default function HomePage() {
  const t = useTranslations("HomePage");

  const groups = asList<{ kicker: string; title: string; body: string; items: string[] }>(t.raw("practice.groups"));
  const pillars = asList<{ title: string; body: string }>(t.raw("pillars.items"));
  const reasons = asList<{ roman: string; title: string; body: string }>(t.raw("reasons.items"));

  const contactLink =
    "font-bold underline decoration-brand-black decoration-1 underline-offset-4 transition-colors hover:bg-brand-blue";

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      {/* ═════════════════════════════ HERO ═════════════════════════════
          The full-width photograph under a soft white-and-blue wash, as it was
          before the redesign; it was liked, so it is restored as it was. */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
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
          {/* Brand mood: cool the image with a wash in the accent blue (guidelines 06.1). */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 via-brand-blue/10 to-transparent mix-blend-multiply" />
          {/* White legibility gradients so the black hero text stays readable. */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-white/95 via-brand-white/80 to-brand-white/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-wide px-6 py-32 sm:px-10 lg:px-16 lg:py-40">
          <div className="reveal max-w-2xl">
            <PageHeading
              eyebrow={t("hero.eyebrow", { city: SITE.address.city })}
              title={
                <>
                  {t("hero.h1Line1")}
                  <br />
                  <em>{t("hero.h1Italic")}</em>
                </>
              }
              lead={t("hero.lead", { short: SITE.shortName })}
              className="max-w-none"
            />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Button href="/contact" arrow>
                {t("hero.primaryCta")}
              </Button>
              <Button href="/services" variant="outline">
                {t("hero.secondaryCta")}
              </Button>
            </div>
          </div>

          {/* The stamp, exactly as before: a small caption over a very faint "1999". */}
          <div className="reveal reveal-delay-5 absolute bottom-16 right-10 hidden flex-col items-end gap-1 text-right lg:flex">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand-black-60">
              {t("hero.captionStamp")}
            </span>
            <span aria-hidden className="text-[3rem] font-light leading-none text-brand-blue/20">
              1999
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ PILLARS ═══════════════════════════ */}
      <SectionShell background="wash" id="pillars">
        <SectionHeading
          eyebrow={t("pillars.eyebrow")}
          title={
            <>
              {t("pillars.headlinePart1")} <em>{t("pillars.headlineItalic")}</em> {t("pillars.headlinePart2")}
            </>
          }
          lead={t("pillars.lead")}
          className="max-w-4xl"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <div key={p.title} className="rounded-2xl bg-brand-white p-8 shadow-hairline">
              <p className="text-sm font-extrabold tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-5 text-xl leading-snug">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-brand-black-80">{p.body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ═══════════════════════════ PRACTICE ══════════════════════════ */}
      <SectionShell background="default" id="practice">
        <SectionHeading
          eyebrow={t("practice.eyebrow")}
          title={
            <>
              {t("practice.headlinePart1")} <em>{t("practice.headlineItalic")}</em>
            </>
          }
          lead={t("practice.lead")}
          className="max-w-4xl"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => (
            <article
              key={g.title}
              className="flex flex-col rounded-2xl border border-brand-black/10 bg-brand-wash/50 p-8 transition duration-300 hover:-translate-y-1 hover:shadow-hairlineLift"
            >
              <IconTile icon={GROUP_ICONS[i] ?? Scale} />
              <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-black-80">{g.kicker}</p>
              <h3 className="mt-2 text-2xl leading-snug">{g.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-brand-black-80">{g.body}</p>
              <ul className="mt-7 space-y-3 border-t border-brand-black/10 pt-6">
                {asList<string>(g.items).map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem]">
                    <span aria-hidden className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Button href="/services" variant="outline" arrow>
            {t("practice.openServices")}
          </Button>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ REASONS ═══════════════════════════
          The accent blue as a full band: the strong moment on the page, in the
          brand's main colour rather than black. */}
      <SectionShell background="blue" id="reasons">
        <SectionHeading
          tone="blue"
          eyebrow={t("reasons.eyebrow")}
          title={
            <>
              {t("reasons.headlinePart1")} <em>{t("reasons.headlineItalic")}</em> {t("reasons.headlinePart2")}
            </>
          }
          lead={t("reasons.lead")}
          className="max-w-4xl"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.roman} className="rounded-2xl bg-brand-white/60 p-8">
              <p className="text-4xl font-extrabold leading-none">{r.roman}</p>
              <h3 className="mt-5 text-xl">{r.title}</h3>
              <p className="mt-3 leading-relaxed text-brand-black-80">{r.body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ═══════════════════════════ LAWYERS ═══════════════════════════ */}
      <SectionShell background="wash" id="lawyers">
        <SectionHeading
          eyebrow={t("lawyers.eyebrow")}
          title={
            <>
              {t("lawyers.headlinePart1")} <em>{t("lawyers.headlineItalic")}</em>
            </>
          }
        />
        <div className="mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {LAWYERS.map((lawyer, i) => (
            <Link
              key={lawyer.slug}
              href={`/lawyers#${lawyer.slug}`}
              className="group block overflow-hidden rounded-2xl bg-brand-white shadow-hairline transition duration-300 hover:-translate-y-1 hover:shadow-hairlineLift"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-wash">
                <Image
                  src={i === 0 ? MEDIA.nirPhoto : MEDIA.deborahPhoto}
                  alt={lawyer.name}
                  fill
                  quality={90}
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(min-width: 640px) 440px, 100vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl">{lawyer.name}</h3>
                <p className="mt-1 text-brand-black-80">{lawyer.role}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <Button href="/lawyers" arrow>
            {t("lawyers.allProfiles")}
          </Button>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ CONTACT ═══════════════════════════
          The page ends on white (the footer fades from white into its blue),
          with the call to action as a soft panel on it. */}
      <SectionShell background="default" id="contact-cta">
        <div className="grid gap-12 rounded-3xl bg-brand-wash p-8 sm:p-12 lg:grid-cols-5 lg:gap-16 lg:p-16">
          <div className="lg:col-span-3">
            <SectionHeading
              eyebrow={t("contact.eyebrow")}
              title={
                <>
                  {t("contact.headlinePart1")} <em>{t("contact.headlineItalic")}</em>
                </>
              }
              lead={t("contact.lead")}
            />
            <div className="mt-8">
              <Button href="/contact" arrow>
                {t("contact.primaryCta")}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="eyebrow">{t("contact.asideEyebrow")}</p>
            <ul className="mt-6 space-y-5 text-lg">
              <li className="flex items-start gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                <a href={`tel:${SITE.phoneTel}`} className={contactLink}>
                  {SITE.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-4">
                <Mail className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                <a href={`mailto:${SITE.email}`} className={contactLink}>
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden />
                <span>{SITE.address.singleLine}</span>
              </li>
            </ul>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}

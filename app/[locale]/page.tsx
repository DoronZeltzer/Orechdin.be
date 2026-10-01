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
    "font-bold underline decoration-brand-black decoration-1 underline-offset-4 transition-colors hover:bg-brand-black hover:text-brand-white";

  return (
    <main id="main-content" className="bg-brand-white text-brand-black selection:bg-brand-blue/40">
      {/* ═════════════════════════════ HERO ═════════════════════════════
          A split: the message on clean white, the photograph beside it.
          The photograph used to sit under three white washes and was almost
          invisible. Per the brand guidelines (06.1) background images may be
          slightly washed out or carry an overlay in the accent blue, so it is
          lightly desaturated and tinted blue, and otherwise left to be seen. */}
      <section className="grid min-h-[min(84vh,800px)] lg:grid-cols-2">
        <div className="flex items-center px-6 py-14 sm:px-10 lg:py-24 lg:pl-16 lg:pr-12 xl:pl-[max(4rem,calc((100vw-78rem)/2+4rem))]">
          <div className="reveal max-w-xl">
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
              // The hero heading shares the screen with the photograph, so it is
              // sized to its half-width column; "vertegenwoordiging," is the
              // longest word and must fit on one line.
              // tailwind-merge drops `leading-*` when a later `text-*` size is given (a size
              // class normally carries its own line-height), so it is restated here.
              titleClassName="text-[length:clamp(2rem,3.4vw,2.9rem)] sm:text-[length:clamp(2rem,3.4vw,2.9rem)] lg:text-[length:clamp(2rem,3.4vw,2.9rem)] leading-[1.1]"
              className="max-w-none"
            />
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/contact" arrow>
                {t("hero.primaryCta")}
              </Button>
              <Button href="/services" variant="outline">
                {t("hero.secondaryCta")}
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[320px] bg-brand-wash lg:min-h-0">
          <Image
            src={MEDIA.heroBg}
            alt={t("hero.imageAlt")}
            fill
            priority
            quality={85}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[62%_50%] [filter:saturate(0.78)]"
          />
          <div aria-hidden className="absolute inset-0 bg-brand-blue/20 mix-blend-multiply" />
          {/* A solid field for the caption, as the guidelines show for text over
              photographs (06.2). */}
          <div className="absolute bottom-0 left-0 bg-brand-blue px-7 py-5 text-brand-black">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em]">{t("hero.captionStamp")}</p>
            <p className="mt-1 text-5xl font-extrabold leading-none">1999</p>
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
        <div className="mt-12 grid gap-px bg-brand-black/15 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <div key={p.title} className="bg-brand-white p-8">
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
              className="flex flex-col border border-brand-black/15 bg-brand-white p-8 transition-colors duration-200 hover:border-brand-black"
            >
              <IconTile icon={GROUP_ICONS[i] ?? Scale} />
              <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-black-80">{g.kicker}</p>
              <h3 className="mt-2 text-2xl leading-snug">{g.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-brand-black-80">{g.body}</p>
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
        <div className="mt-10">
          <Button href="/services" variant="outline" arrow>
            {t("practice.openServices")}
          </Button>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ REASONS ═══════════════════════════
          A black band: the one dark moment on the page, in the way the
          guidelines' slogan pages are black with white and blue type. */}
      <SectionShell background="dark" id="reasons">
        <SectionHeading
          tone="dark"
          eyebrow={t("reasons.eyebrow")}
          title={
            <>
              {t("reasons.headlinePart1")} <em>{t("reasons.headlineItalic")}</em> {t("reasons.headlinePart2")}
            </>
          }
          lead={t("reasons.lead")}
          className="max-w-4xl"
        />
        <div className="mt-14 grid gap-x-14 gap-y-12 sm:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.roman} className="border-t border-brand-white/25 pt-6">
              <p className="text-4xl font-extrabold leading-none text-brand-blue">{r.roman}</p>
              <h3 className="mt-5 text-xl text-brand-white">{r.title}</h3>
              <p className="mt-3 leading-relaxed text-brand-white/80">{r.body}</p>
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
              className="group block bg-brand-white transition-shadow duration-200 hover:shadow-plate"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-wash">
                <Image
                  src={i === 0 ? MEDIA.nirPhoto : MEDIA.deborahPhoto}
                  alt={lawyer.name}
                  fill
                  quality={90}
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(min-width: 640px) 380px, 100vw"
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
          <Button href="/lawyers" variant="dark" arrow>
            {t("lawyers.allProfiles")}
          </Button>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ CONTACT ═══════════════════════════
          The page ends on white (the footer fades from white into its blue),
          with the call to action as a blue panel on it. */}
      <SectionShell background="default" id="contact-cta">
        <div className="grid gap-12 bg-brand-blue p-8 sm:p-12 lg:grid-cols-5 lg:gap-16 lg:p-16">
          <div className="lg:col-span-3">
            <SectionHeading
              tone="blue"
              eyebrow={t("contact.eyebrow")}
              title={
                <>
                  {t("contact.headlinePart1")} <em>{t("contact.headlineItalic")}</em>
                </>
              }
              lead={t("contact.lead")}
            />
            <div className="mt-8">
              <Button href="/contact" variant="dark" arrow>
                {t("contact.primaryCta")}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="eyebrow text-brand-black before:bg-brand-black">{t("contact.asideEyebrow")}</p>
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

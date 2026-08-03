import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { LAWYERS, MEDIA, SITE } from "@/lib/site";
import { SectionShell } from "@/components/design-system/section-shell";

/* ------------------------------------------------------------------ */
/*  Static-params: tell Next which locales exist                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const t = useTranslations("HomePage");
  const tCommon = useTranslations("Common");
  const tDisclaimer = useTranslations("Disclaimer");

  /* ── Practice groups ─────────────────────────────────────────────── */
  const groupsRaw = t.raw("practice.groups");
  const groups = (
    Array.isArray(groupsRaw) ? groupsRaw : typeof groupsRaw === "object" && groupsRaw !== null ? Object.values(groupsRaw) : []
  ) as Array<{ kicker: string; title: string; body: string; items: string[] }>;

  /* ── Pillar items ────────────────────────────────────────────────── */
  const pillarsRaw = t.raw("pillars.items");
  const pillars = (
    Array.isArray(pillarsRaw) ? pillarsRaw : typeof pillarsRaw === "object" && pillarsRaw !== null ? Object.values(pillarsRaw) : []
  ) as Array<{ title: string; body: string }>;

  /* ── Reasons items ───────────────────────────────────────────────── */
  const reasonsRaw = t.raw("reasons.items");
  const reasons = (
    Array.isArray(reasonsRaw) ? reasonsRaw : typeof reasonsRaw === "object" && reasonsRaw !== null ? Object.values(reasonsRaw) : []
  ) as Array<{ roman: string; title: string; body: string }>;

  return (
    <main id="main-content" className="bg-orech-paper text-orech-ink selection:bg-orech-bronze/30">

      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={MEDIA.heroBg}
            alt={t("hero.imageAlt")}
            fill
            priority
            quality={90}
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orech-paper/95 via-orech-paper/80 to-orech-paper/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-orech-paper via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-wide w-full px-6 sm:px-10 lg:px-16 py-32 lg:py-40">
          <div className="max-w-2xl reveal">
            <p className="eyebrow mb-6 reveal reveal-delay-1">
              {t("hero.eyebrow", { city: SITE.address.city })}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-light tracking-tight text-orech-ink leading-[1.1] reveal reveal-delay-2">
              {t("hero.h1Line1")}
              <br />
              <em className="italic-display">{t("hero.h1Italic")}</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-orech-ink/80 font-light reveal reveal-delay-3">
              {t("hero.lead", { short: SITE.shortName })}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 reveal reveal-delay-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-orech-bronze px-8 py-3.5 text-sm font-medium uppercase tracking-wider text-white shadow-lg transition hover:bg-orech-bronzeMuted hover:shadow-xl"
              >
                {t("hero.primaryCta")} <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-lg border border-orech-line bg-orech-paper/60 px-8 py-3.5 text-sm font-medium uppercase tracking-wider text-orech-ink backdrop-blur-sm transition hover:border-orech-bronze/50 hover:bg-orech-paper"
              >
                {t("hero.secondaryCta")}
              </Link>
            </div>
          </div>

          {/* Stamp */}
          <div className="absolute right-10 bottom-16 hidden lg:flex flex-col items-end gap-1 text-right reveal reveal-delay-5">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-orech-mist">
              {t("hero.captionStamp")}
            </span>
            <span className="font-display text-[3rem] font-light text-orech-bronze/20 leading-none">
              1999
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ PILLARS ════════════════════════════════ */}
      <SectionShell background="elevated" id="pillars">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">{t("pillars.eyebrow")}</p>
          <h2 className="text-3xl lg:text-5xl font-display font-light tracking-tight text-orech-ink">
            {t("pillars.headlinePart1")}{" "}
            <em className="italic-display">{t("pillars.headlineItalic")}</em>{" "}
            {t("pillars.headlinePart2")}
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-relaxed text-orech-mist font-light">
            {t("pillars.lead")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="plate p-8 flex flex-col items-start card-lift"
            >
              <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.22em] text-orech-bronze mb-4">
                0{i + 1}
              </span>
              <h3 className="text-lg font-medium text-orech-ink mb-3">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-orech-mist flex-1">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ═══════════════════════════ PRACTICE ═══════════════════════════════ */}
      <SectionShell background="default" id="practice">
        <div className="mb-16">
          <p className="eyebrow mb-4">{t("practice.eyebrow")}</p>
          <h2 className="text-3xl lg:text-5xl font-display font-light tracking-tight text-orech-ink max-w-3xl">
            {t("practice.headlinePart1")}{" "}
            <em className="italic-display">{t("practice.headlineItalic")}</em>
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-orech-mist font-light">
            {t("practice.lead")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groups.map((g) => (
            <div
              key={g.title}
              className="p-8 rounded-2xl bg-orech-slate/50 border border-orech-line relative overflow-hidden backdrop-blur-md flex flex-col items-start hover:border-orech-bronze/40 transition-colors card-lift"
            >
              <span className="eyebrow mb-4">{g.kicker}</span>
              <h3 className="text-xl font-medium text-orech-ink mb-3">
                {g.title}
              </h3>
              <p className="text-orech-mist text-sm leading-relaxed flex-1 mb-8">
                {g.body}
              </p>
              <ul className="space-y-3 w-full border-t border-orech-line pt-6">
                {((Array.isArray(g.items) ? g.items : typeof g.items === "object" && g.items !== null ? Object.values(g.items) : []) as string[]).map((item) => (
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
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-orech-bronze hover:text-orech-bronzeMuted transition-colors"
          >
            {t("practice.openServices")} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ REASONS ════════════════════════════════ */}
      <SectionShell background="accent" id="reasons">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">{t("reasons.eyebrow")}</p>
          <h2 className="text-3xl lg:text-5xl font-display font-light tracking-tight text-orech-ink">
            {t("reasons.headlinePart1")}{" "}
            <em className="italic-display">{t("reasons.headlineItalic")}</em>{" "}
            {t("reasons.headlinePart2")}
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-relaxed text-orech-mist font-light">
            {t("reasons.lead")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl mx-auto">
          {reasons.map((r) => (
            <div key={r.roman} className="flex gap-5">
              <span className="font-display text-3xl font-light text-orech-bronze/40 leading-none mt-1 shrink-0 w-12 text-right">
                {r.roman}
              </span>
              <div>
                <h3 className="text-lg font-medium text-orech-ink mb-2">{r.title}</h3>
                <p className="text-sm leading-relaxed text-orech-mist">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ═══════════════════════════ LAWYERS ════════════════════════════════ */}
      <SectionShell background="default" id="lawyers">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">{t("lawyers.eyebrow")}</p>
          <h2 className="text-3xl lg:text-5xl font-display font-light tracking-tight text-orech-ink">
            {t("lawyers.headlinePart1")}{" "}
            <em className="italic-display">{t("lawyers.headlineItalic")}</em>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {LAWYERS.map((lawyer, i) => (
            <Link
              key={lawyer.slug}
              href={`/lawyers#${lawyer.slug}`}
              className="group plate p-6 flex flex-col items-center text-center card-lift"
            >
              <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-orech-line mb-6">
                <Image
                  src={i === 0 ? MEDIA.nirPhoto : MEDIA.deborahPhoto}
                  alt={lawyer.name}
                  fill
                  quality={92}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="160px"
                />
              </div>
              <h3 className="font-display text-2xl text-orech-ink group-hover:text-orech-bronze transition-colors">
                {lawyer.name}
              </h3>
              <p className="mt-1 text-sm text-orech-bronze">{lawyer.role}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/lawyers"
            className="inline-flex items-center gap-2 text-sm font-medium text-orech-bronze hover:text-orech-bronzeMuted transition-colors"
          >
            {t("lawyers.allProfiles")} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ CONTACT CTA ═══════════════════════════ */}
      <SectionShell background="elevated" id="contact-cta">
        <div className="max-w-3xl mx-auto text-center">
          <p className="eyebrow mb-4">{t("contact.eyebrow")}</p>
          <h2 className="text-3xl lg:text-5xl font-display font-light tracking-tight text-orech-ink">
            {t("contact.headlinePart1")}{" "}
            <em className="italic-display">{t("contact.headlineItalic")}</em>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-orech-mist font-light max-w-2xl mx-auto">
            {t("contact.lead")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-orech-bronze px-8 py-3.5 text-sm font-medium uppercase tracking-wider text-white shadow-lg transition hover:bg-orech-bronzeMuted hover:shadow-xl"
            >
              {t("contact.primaryCta")} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-orech-line/50">
            <p className="eyebrow mb-3">{t("contact.asideEyebrow")}</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-orech-mist">
              <a href={`tel:${SITE.phoneTel}`} className="hover:text-orech-bronze transition-colors">
                {SITE.phoneDisplay}
              </a>
              <a href={`mailto:${SITE.email}`} className="hover:text-orech-bronze transition-colors">
                {SITE.email}
              </a>
              <span>{SITE.address.singleLine}</span>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ═══════════════════════════ DISCLAIMER ═════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-xs leading-relaxed text-orech-mist/60 text-center">
          {tDisclaimer("body")}
        </p>
      </div>
    </main>
  );
}

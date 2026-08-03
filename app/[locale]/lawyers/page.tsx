import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { LAWYERS, MEDIA, SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LawyersPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/lawyers",
    locale: locale as "nl" | "en" | "fr",
  });
}

export default function LawyersPage() {
  const t = useTranslations("LawyersPage");
  const tCommon = useTranslations("Common");
  const tDisclaimer = useTranslations("Disclaimer");

  return (
    <main id="main-content" className="pb-24 pt-12 md:pt-20 bg-orech-mist/5">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl text-orech-ink md:text-5xl">
          {t("headline")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-orech-ink/80">
          {t("lead")}
        </p>
      </div>

      <section
        className="mx-auto mt-12 max-w-4xl px-4 md:px-6"
        aria-labelledby="profiles-heading"
      >
        <h2
          id="profiles-heading"
          className="font-display text-2xl text-orech-ink md:text-3xl"
        >
          {t("profilesHeading")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-orech-ink/75">
          {t("profilesIntro")}
        </p>
      </section>

      <div className="mx-auto mt-12 max-w-4xl space-y-20 px-4 md:px-6">
        {LAWYERS.map((lawyer, i) => (
          <article
            key={lawyer.slug}
            id={lawyer.slug}
            className="scroll-mt-28 border-t border-orech-line pt-16 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-col gap-10 md:flex-row md:items-start group">
              <div className="relative mx-auto h-48 w-48 shrink-0 overflow-hidden rounded-2xl border border-orech-line shadow-sm md:mx-0 md:h-52 md:w-52 transition-transform duration-500 group-hover:scale-[1.02]">
                <Image
                  src={i === 0 ? MEDIA.nirPhoto : MEDIA.deborahPhoto}
                  alt={lawyer.name}
                  fill
                  quality={92}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 192px, 208px"
                  priority={i === 0}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-3xl text-orech-ink md:text-4xl">
                  {lawyer.name}
                </h2>
                <p className="mt-2 text-sm font-medium text-orech-bronze">
                  {lawyer.role}
                </p>
                <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-wider text-orech-mist">
                  {t("biographyNote")}
                </p>
                {lawyer.bio.map((p) => (
                  <p
                    key={p.slice(0, 40)}
                    className="mt-5 leading-relaxed text-orech-ink/80"
                  >
                    {p}
                  </p>
                ))}
                <dl className="mt-8 space-y-4 rounded-2xl border border-orech-line bg-orech-slate/50 p-6 text-sm backdrop-blur-sm shadow-sm transition hover:shadow-md">
                  <div>
                    <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-orech-ink/60">
                      {tCommon("mobileLabel")}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`tel:${lawyer.mobileTel}`}
                        className="font-medium text-orech-bronze hover:text-orech-bronzeMuted transition-colors"
                      >
                        {lawyer.mobileDisplay}
                      </a>
                    </dd>
                  </div>
                  <div className="pt-2 border-t border-orech-line/50">
                    <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-orech-ink/60">
                      {tCommon("emailLabel")}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${lawyer.email}`}
                        className="font-medium text-orech-bronze hover:text-orech-bronzeMuted transition-colors"
                      >
                        {lawyer.email}
                      </a>
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center rounded-lg bg-orech-bronze px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-orech-bronzeMuted transition"
                  >
                    {t("ctaContactOffice")}
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center rounded-lg border border-orech-line px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-orech-ink hover:border-orech-bronze transition"
                  >
                    {t("ctaPracticeAreas")}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-20 flex max-w-4xl flex-wrap gap-4 border-t border-orech-line px-4 pt-12 md:px-6">
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center rounded-lg bg-orech-bronze px-8 py-3 text-sm font-medium uppercase tracking-wider text-white hover:bg-orech-bronzeMuted transition"
        >
          {t("footerCtaContact")}
        </Link>
        <Link
          href="/office"
          className="inline-flex min-h-11 items-center rounded-lg border border-orech-line px-8 py-3 text-sm font-medium uppercase tracking-wider text-orech-ink hover:border-orech-bronze transition"
        >
          {t("footerCtaOffice")}
        </Link>
      </div>

      <p className="mx-auto mt-12 max-w-4xl px-4 text-sm text-orech-ink/65 md:px-6">
        {tDisclaimer("body")}
      </p>
    </main>
  );
}

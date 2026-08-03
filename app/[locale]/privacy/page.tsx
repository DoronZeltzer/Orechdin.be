import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/privacy",
    locale: locale as "nl" | "en" | "fr",
  });
}

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");

  return (
    <main id="main-content" className="pb-24 pt-12 md:pt-20 bg-orech-paper min-h-screen text-orech-ink selection:bg-orech-bronze/30">
      <article className="mx-auto max-w-4xl px-4 md:px-6">
        <header className="max-w-3xl border-b border-orech-line pb-10">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-orech-ink md:text-5xl">
            {t("headline")}
          </h1>
          <p className="mt-2 font-display text-xl text-orech-mist">
            {t("subdisplay")}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-orech-mist">
            {t("intro")}{" "}
            <a
              href={SITE.livePrivacyUrl}
              className="font-medium text-orech-bronze underline underline-offset-2 hover:text-orech-bronzeMuted transition-colors"
              rel="noopener noreferrer"
            >
              {t("officialPolicy")}
            </a>
            .
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <section
            className="rounded-2xl border border-orech-line bg-orech-slate/50 p-8 shadow-sm backdrop-blur-sm"
            aria-labelledby="controller-heading"
          >
            <h2
              id="controller-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("controllerHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("controllerBody1", {
                kbo: SITE.kbo,
                court: SITE.court,
                street: SITE.address.street,
                postal: SITE.address.postal,
                city: SITE.address.city,
              })}
            </p>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("controllerBody2", { name: SITE.dpo.name })}{" "}
              <a
                href={`mailto:${SITE.dpo.email}`}
                className="font-medium text-orech-bronze underline-offset-2 hover:text-orech-bronzeMuted transition-colors"
              >
                {SITE.dpo.email}
              </a>
              {t("controllerBody3", { phone: SITE.dpo.phoneDisplay })}
            </p>
          </section>

          <section aria-labelledby="processed-heading">
            <h2
              id="processed-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("processedHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("processedBody")}
            </p>
          </section>

          <section aria-labelledby="purposes-heading">
            <h2
              id="purposes-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("purposesHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("purposesBody")}
            </p>
          </section>

          <section
            className="rounded-2xl border border-orech-line bg-orech-slate/30 p-8"
            aria-labelledby="retention-heading"
          >
            <h2
              id="retention-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("retentionHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("retentionBody")}
            </p>
          </section>

          <section aria-labelledby="rights-heading">
            <h2
              id="rights-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("rightsHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("rightsBody1")}{" "}
              <a
                href={`mailto:${SITE.dpo.email}`}
                className="font-medium text-orech-bronze underline-offset-2 hover:text-orech-bronzeMuted transition-colors"
              >
                {SITE.dpo.email}
              </a>
              {t("rightsBody2")}
            </p>
          </section>

          <section aria-labelledby="marketing-heading">
            <h2
              id="marketing-heading"
              className="font-display text-2xl text-orech-ink md:text-3xl"
            >
              {t("marketingHeading")}
            </h2>
            <p className="mt-4 leading-relaxed text-orech-ink/80">
              {t("marketingBody")}
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-orech-line pt-10">
          <p className="text-sm leading-relaxed text-orech-mist">
            {t("supportNote")}
          </p>
          <p className="mt-6">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center rounded-lg bg-orech-bronze px-6 py-2.5 text-sm font-medium text-white hover:bg-orech-bronzeMuted transition"
            >
              {t("ctaContact")}
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

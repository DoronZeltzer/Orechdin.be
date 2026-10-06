import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactMain } from "@/components/contact/contact-main";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage.metadata" });
  return pageMetadata({ title: t("title"), description: t("description"), path: "/contact", locale: locale as Locale });
}

function ContactPageContent() {
  return (
    <main id="main-content">
      <ContactMain />
    </main>
  );
}

// The language is set from the address before the page renders, so every page can be generated ahead of time.
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactPageContent />;
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactMain } from "@/components/contact/contact-main";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage.metadata" });
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/contact",
    locale: locale as "nl" | "en" | "fr",
  });
}

export default function ContactPage() {
  return (
    <main id="main-content" className="pb-24 pt-12 md:pt-20">
      <ContactMain />
    </main>
  );
}

import { SITE } from "@/lib/site";

/** WebSite node for discoverability — no SearchAction until on-site search exists. */
export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.shortName,
    url: SITE.url,
    inLanguage: "en-BE",
    publisher: {
      "@type": "Organization",
      name: SITE.legalName,
      url: SITE.url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

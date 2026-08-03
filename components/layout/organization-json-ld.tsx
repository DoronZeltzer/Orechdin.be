import { SITE, MEDIA } from "@/lib/site";

/** Organization graph node - complements LegalService in json-ld.tsx */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    alternateName: [SITE.title, SITE.shortName],
    url: SITE.url,
    logo: `${SITE.url}${MEDIA.logo}`,
    email: SITE.email,
    telephone: SITE.phoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      postalCode: SITE.address.postal,
      addressLocality: SITE.address.city,
      addressCountry: SITE.address.country,
    },
    identifier: {
      "@type": "PropertyValue",
      name: "KBO",
      value: SITE.kbo,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

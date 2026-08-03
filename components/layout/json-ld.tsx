import { LAWYERS, MEDIA, SITE } from "@/lib/site";

const PORTRAITS: Record<string, string> = {
  "nir-zeltzer": MEDIA.nirPhoto,
  "deborah-johnson": MEDIA.deborahPhoto,
};

/**
 * Combined LegalService + Person graph.
 *
 * The two attorneys are emitted as full `Person` nodes (with images,
 * email, phone, jobTitle and `worksFor` back-pointer) so search engines
 * can build a knowledge-panel-grade representation of the firm. The
 * `LegalService` carries `employee` references to those persons, and
 * keeps `founder` for backwards compatibility.
 */
export function LegalServiceJsonLd() {
  const persons = LAWYERS.map((l) => ({
    "@type": "Person" as const,
    "@id": `${SITE.url}/lawyers#${l.slug}`,
    name: l.name,
    jobTitle: l.role,
    email: l.email,
    telephone: l.mobileTel,
    image: `${SITE.url}${PORTRAITS[l.slug] ?? ""}`,
    url: `${SITE.url}/lawyers#${l.slug}`,
    worksFor: { "@id": `${SITE.url}#legal-service` },
  }));

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LegalService",
        "@id": `${SITE.url}#legal-service`,
        name: SITE.shortName,
        legalName: SITE.legalName,
        description: SITE.description,
        url: SITE.url,
        telephone: SITE.phoneTel,
        email: SITE.email,
        priceRange: "€€",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          postalCode: SITE.address.postal,
          addressLocality: SITE.address.city,
          addressCountry: SITE.address.country,
        },
        areaServed: { "@type": "City", name: "Antwerp" },
        founder: persons.map((p) => ({ "@id": p["@id"] })),
        employee: persons.map((p) => ({ "@id": p["@id"] })),
      },
      ...persons,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

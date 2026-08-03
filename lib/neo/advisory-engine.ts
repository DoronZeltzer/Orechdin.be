import { type Locale } from "./legal-reply";

export interface AdvisoryGuidance {
  category: string;
  proceduralSteps: string;
  documentChecklist: string[];
  feeOrientation: string;
  escalationAdvice: string;
}

const ADVISORY_KB: {
  keywords: string[];
  guidance: Record<Locale, AdvisoryGuidance>;
}[] = [
  {
    keywords: ["compromis", "kopen", "huis kopen", "buying", "acheter"],
    guidance: {
      en: {
        category: "Property purchase (compromis)",
        proceduralSteps: "1. Review the compromis before signing.\n2. Sign the compromis.\n3. Pay the deposit (usually 10%).\n4. Wait for the notary to perform required searches.\n5. Sign the authentic deed within 4 months.",
        documentChecklist: ["Copy of ID", "Draft compromis", "Recent soil certificate", "EPC certificate", "Urban planning information"],
        feeOrientation: "Notary fees are roughly 1.5% to 2% of the purchase price, plus registration duties depending on the region and your situation.",
        escalationAdvice: "Contact our real estate specialist if you spot unusual clauses in the compromis or if the seller pressures you to sign immediately.",
      },
      nl: {
        category: "Aankoop vastgoed (compromis)",
        proceduralSteps: "1. Kijk het compromis na voor ondertekening.\n2. Onderteken het compromis.\n3. Betaal het voorschot (meestal 10%).\n4. Wacht tot de notaris de nodige opzoekingen doet.\n5. Onderteken de authentieke akte binnen 4 maanden.",
        documentChecklist: ["Kopie identiteitskaart", "Ontwerp compromis", "Bodemattest", "EPC-attest", "Stedenbouwkundige inlichtingen"],
        feeOrientation: "Notariskosten bedragen ongeveer 1,5% tot 2% van de aankoopprijs, plus registratierechten afhankelijk van het gewest en uw situatie.",
        escalationAdvice: "Neem contact op met onze vastgoedspecialist als u ongebruikelijke clausules in het compromis opmerkt of als de verkoper druk uitoefent om onmiddellijk te tekenen.",
      },
      fr: {
        category: "Achat immobilier (compromis)",
        proceduralSteps: "1. Révisez le compromis avant de signer.\n2. Signez le compromis.\n3. Payez l'acompte (généralement 10%).\n4. Attendez que le notaire effectue les recherches requises.\n5. Signez l'acte authentique dans les 4 mois.",
        documentChecklist: ["Copie de la carte d'identité", "Projet de compromis", "Attestation de sol", "Certificat PEB", "Renseignements urbanistiques"],
        feeOrientation: "Les frais de notaire sont d'environ 1,5% à 2% du prix d'achat, plus les droits d'enregistrement selon la région et votre situation.",
        escalationAdvice: "Contactez notre spécialiste en immobilier si vous repérez des clauses inhabituelles dans le compromis ou si le vendeur vous pousse à signer immédiatement.",
      }
    }
  },
  {
    keywords: ["schenking", "donation", "gift", "doneren", "schenkingsakte"],
    guidance: {
      en: {
        category: "Donation (schenkingsakte)",
        proceduralSteps: "1. Discuss the purpose and conditions of the gift.\n2. Draft the deed of donation.\n3. Sign the deed before the notary.\n4. Register the deed to finalize the donation.",
        documentChecklist: ["Copy of ID of donor and donee", "Proof of ownership of the given asset", "Value estimation of the asset"],
        feeOrientation: "Depends on family relationship and region (e.g., 3% or 3.3% for direct line in movable assets, real estate is progressive).",
        escalationAdvice: "Contact the specialist to discuss retention of usufruct or return clauses.",
      },
      nl: {
        category: "Schenking (schenkingsakte)",
        proceduralSteps: "1. Bespreek het doel en de voorwaarden van de schenking.\n2. Opmaak van de schenkingsakte.\n3. Ondertekening van de akte voor de notaris.\n4. Registratie van de akte om de schenking te finaliseren.",
        documentChecklist: ["Kopie identiteitskaart schenker en begiftigde", "Eigendomsbewijs van het geschonken goed", "Waardebepaling van het goed"],
        feeOrientation: "Afhankelijk van de familierelatie en het gewest (bijv. 3% of 3,3% voor rechte lijn bij roerende goederen, onroerend goed is progressief).",
        escalationAdvice: "Neem contact op met de specialist om voorbehoud van vruchtgebruik of bedingen van terugkeer te bespreken.",
      },
      fr: {
        category: "Donation (acte de donation)",
        proceduralSteps: "1. Discutez de l'objectif et des conditions de la donation.\n2. Rédaction de l'acte de donation.\n3. Signature de l'acte devant le notaire.\n4. Enregistrement de l'acte pour finaliser la donation.",
        documentChecklist: ["Copie de la carte d'identité du donateur et du donataire", "Preuve de propriété du bien donné", "Estimation de la valeur du bien"],
        feeOrientation: "Dépend de la relation familiale et de la région (ex. 3% ou 3,3% en ligne directe pour les biens mobiliers, l'immobilier est progressif).",
        escalationAdvice: "Contactez le spécialiste pour discuter de la réserve d'usufruit ou des clauses de retour.",
      }
    }
  }
];

export function lookupAdvisory(
  userMessage: string,
  documentTypes: string[],
  legalConcepts: string[],
  locale: Locale,
): AdvisoryGuidance | null {
  const lowerMsg = userMessage.toLowerCase();
  
  for (const entry of ADVISORY_KB) {
    const hits = entry.keywords.some(kw => 
      lowerMsg.includes(kw.toLowerCase()) || 
      documentTypes.some(d => d.toLowerCase().includes(kw.toLowerCase())) ||
      legalConcepts.some(c => c.toLowerCase().includes(kw.toLowerCase()))
    );

    if (hits && entry.guidance[locale]) {
      return entry.guidance[locale];
    }
  }

  return null;
}

export function formatAdvisoryBlock(
  advisory: AdvisoryGuidance,
  locale: Locale,
): string {
  const t = {
    en: { cat: "Category", steps: "Procedural Steps", docs: "Document Checklist", fees: "Fee Orientation", esc: "Escalation Advice" },
    nl: { cat: "Categorie", steps: "Procedurele Stappen", docs: "Documenten Checklist", fees: "Kostenoriëntatie", esc: "Escalatie Advies" },
    fr: { cat: "Catégorie", steps: "Étapes Procédurales", docs: "Liste de Documents", fees: "Orientation des Frais", esc: "Conseil d'Escalade" }
  }[locale] || { cat: "Category", steps: "Procedural Steps", docs: "Document Checklist", fees: "Fee Orientation", esc: "Escalation Advice" };

  return `<advisory_guidance>
  <${t.cat}>${advisory.category}</${t.cat}>
  <${t.steps}>\n${advisory.proceduralSteps}\n</${t.steps}>
  <${t.docs}>\n${advisory.documentChecklist.map(d => `- ${d}`).join("\n")}\n</${t.docs}>
  <${t.fees}>${advisory.feeOrientation}</${t.fees}>
  <${t.esc}>${advisory.escalationAdvice}</${t.esc}>
</advisory_guidance>`;
}

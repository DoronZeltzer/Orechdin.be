import { type Locale } from "./legal-reply";

export interface NormalizedMessage {
  cleaned: string;
  raw: string;
  entities: ExtractedEntities;
  detectedLanguages: Locale[];
  annotationBlock: string;
}

export interface ExtractedEntities {
  dates: string[];
  amounts: string[];
  documentTypes: string[];
  partyNames: string[];
  locations: string[];
  legalConcepts: string[];
}

const ABBREVIATIONS: Record<string, string> = {
  "bvba": "besloten vennootschap met beperkte aansprakelijkheid",
  "nv": "naamloze vennootschap",
  "vzw": "vereniging zonder winstoogmerk",
  "t.a.v.": "ter attentie van",
  "btw": "belasting over de toegevoegde waarde",
  "m.b.t.": "met betrekking tot",
  "i.v.m.": "in verband met",
  "n.v.t.": "niet van toepassing",
  "z.s.m.": "zo snel mogelijk",
  "fyi": "for your information",
  "asap": "as soon as possible",
};

const DATE_REGEX = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}\s+(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\s+\d{2,4}|vorige maand|vorig jaar|\d+\s+(jaar|maand|mnd|week|weken|dag|dagen)\s+geleden)\b/gi;
const AMOUNT_REGEX = /\b(€\s*\d+[\.,]?\d*|\d+[\.,]?\d*\s*euro|EUR\s*\d+[\.,]?\d*|usd\s*\d+[\.,]?\d*|\$\s*\d+[\.,]?\d*)\b/gi;

const DOC_TYPES = [
  "compromis", "schenkingsakte", "testament", "volmacht",
  "huwelijkscontract", "samenlevingscontract", "statuten",
  "koopovereenkomst", "verkoopovereenkomst", "erfrechtverklaring",
  "contract", "overeenkomst", "akte", "factuur", "brief"
];

const LEGAL_CONCEPTS = [
  "registratierechten", "vruchtgebruik", "erfpacht",
  "mede-eigendom", "naakte eigendom", "schenking",
  "erfenis", "successierechten", "notariskosten",
  "hypotheek", "beslag", "faillissement", "vereffening"
];

function extractPattern(text: string, regex: RegExp): string[] {
  const matches = [...text.matchAll(regex)];
  return matches.map(m => m[0]);
}

function extractKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(k => lowerText.includes(k.toLowerCase()));
}

export function normalizeMessage(raw: string): NormalizedMessage {
  // Strip noise
  let cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/([?!.]){2,}/g, "$1") // repeated punctuation
    .trim();

  // Expand abbreviations
  const words = cleaned.split(" ");
  cleaned = words.map(w => {
    const lower = w.toLowerCase().replace(/[.,]$/, "");
    return ABBREVIATIONS[lower] ? w.replace(new RegExp(lower, "i"), ABBREVIATIONS[lower]) : w;
  }).join(" ");

  // Extract entities
  const dates = extractPattern(cleaned, DATE_REGEX);
  const amounts = extractPattern(cleaned, AMOUNT_REGEX);
  const documentTypes = extractKeywords(cleaned, DOC_TYPES);
  const legalConcepts = extractKeywords(cleaned, LEGAL_CONCEPTS);
  const partyNames: string[] = []; // Usually requires generic regex or Spacy-like NLP, we keep it simple here
  const locations: string[] = []; // Same as above

  const entities = { dates, amounts, documentTypes, partyNames, locations, legalConcepts };

  // Detect code switching
  const detectedLanguages: Locale[] = [];
  const lowerCleaned = cleaned.toLowerCase();
  
  const nlWords = ["de", "het", "een", "ik", "jij", "hij", "zij", "wij", "jullie", "zij", "is", "zijn", "heb", "hebben", "voor", "van", "met"];
  const frWords = ["le", "la", "les", "un", "une", "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "est", "sont", "ai", "ont", "pour", "de", "avec"];
  const enWords = ["the", "a", "an", "i", "you", "he", "she", "it", "we", "they", "is", "are", "have", "has", "for", "of", "with"];

  const countWords = (wordsList: string[]) => wordsList.filter(w => lowerCleaned.includes(` ${w} `)).length;
  
  const nlCount = countWords(nlWords);
  const frCount = countWords(frWords);
  const enCount = countWords(enWords);

  if (nlCount > 2) detectedLanguages.push("nl");
  if (frCount > 2) detectedLanguages.push("fr");
  if (enCount > 2) detectedLanguages.push("en");
  
  if (detectedLanguages.length === 0) {
      if (nlCount >= frCount && nlCount >= enCount) detectedLanguages.push("nl");
      else if (enCount >= nlCount && enCount >= frCount) detectedLanguages.push("en");
      else detectedLanguages.push("fr");
  }

  // Build annotation block
  const annotations = [];
  if (dates.length > 0) annotations.push(`Dates mentioned: ${dates.join(", ")}`);
  if (amounts.length > 0) annotations.push(`Amounts mentioned: ${amounts.join(", ")}`);
  if (documentTypes.length > 0) annotations.push(`Document types: ${documentTypes.join(", ")}`);
  if (legalConcepts.length > 0) annotations.push(`Legal concepts: ${legalConcepts.join(", ")}`);
  if (detectedLanguages.length > 1) annotations.push(`Code-switching detected: ${detectedLanguages.join(", ")}`);

  let annotationBlock = "";
  if (annotations.length > 0) {
    annotationBlock = `<translator_analysis>\n${annotations.join("\n")}\n</translator_analysis>`;
  }

  return {
    cleaned,
    raw,
    entities,
    detectedLanguages,
    annotationBlock,
  };
}

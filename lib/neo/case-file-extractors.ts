/**
 * Pure, deterministic extractors that turn a transcript + uploaded files
 * into the structured leaves of a CaseFile (parties, chronology, issues,
 * exhibits, deadlines, damages).
 *
 * All extractors are regex / heuristic only. No LLM call - they run on
 * every keystroke in the dossier sidebar. The lawyer is the source of
 * truth; NEO only proposes what it thinks it sees.
 *
 * Belgian-leaning patterns: NL/FR/EN trilingual cues, Flemish court names,
 * € amounts, common practice-area vocabulary.
 */

import type { IntakeMessage, IntakeFile } from "./intake-types";
import type {
  ChronologyEntry,
  DamageCategory,
  DamageEntry,
  DeadlineKind,
  ExhibitClassification,
  ExhibitEntry,
  IssueStrength,
  LegalIssue,
  PartyEntry,
  PartyRole,
  ProceduralEntry,
  SourceRef,
} from "./case-file-types";
import type { PracticeAreaSuggestion } from "./intake-summary";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_QUOTE = 160;

function shortQuote(text: string): string | undefined {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.length > MAX_QUOTE ? `${cleaned.slice(0, MAX_QUOTE - 1)}…` : cleaned;
}

function makeUserSource(msg: IntakeMessage, snippet?: string): SourceRef {
  return {
    kind: "user_message",
    ref: String(msg.sequence_no),
    quote: shortQuote(snippet ?? msg.content_redacted),
  };
}

function makeDocSource(file: { original_filename: string }): SourceRef {
  return { kind: "document", ref: file.original_filename };
}

function uniqueBy<T>(items: T[], keyFn: (x: T) => string, max?: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = keyFn(item).toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
    if (max && out.length >= max) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

const ISO_DATE_RX = /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/;
const DMY_DATE_RX = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;
const RELATIVE_RX =
  /\b(\d+)\s+(years?|months?|weeks?|days?|hours?|jaren?|maanden?|weken?|dagen?|uren?|ans?|mois|semaines?|jours?|heures?)\s+(ago|geleden|il y a)?\b/i;
const NAMED_DAY_RX =
  /\b(yesterday|today|tomorrow|gisteren|vandaag|morgen|hier|aujourd'hui|demain|last\s+(?:week|month|year)|next\s+(?:week|month|year))\b/i;

function tryParseDate(text: string, now: Date = new Date()): string | undefined {
  const iso = text.match(ISO_DATE_RX);
  if (iso) {
    const [, y, m, d] = iso;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const dmy = text.match(DMY_DATE_RX);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = (Number(y) > 50 ? "19" : "20") + y;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const rel = text.match(RELATIVE_RX);
  if (rel) {
    const n = Number(rel[1]);
    const unit = rel[2].toLowerCase();
    const dt = new Date(now);
    if (/year|jaar|jare|an/.test(unit)) dt.setFullYear(dt.getFullYear() - n);
    else if (/month|maand|mois/.test(unit)) dt.setMonth(dt.getMonth() - n);
    else if (/week|semaine/.test(unit)) dt.setDate(dt.getDate() - n * 7);
    else if (/day|dag|jour/.test(unit)) dt.setDate(dt.getDate() - n);
    else if (/hour|uur|heure/.test(unit)) dt.setHours(dt.getHours() - n);
    return dt.toISOString().slice(0, 10);
  }
  if (NAMED_DAY_RX.test(text)) {
    const lower = text.toLowerCase();
    const dt = new Date(now);
    if (/tomorrow|morgen|demain/.test(lower)) dt.setDate(dt.getDate() + 1);
    else if (/yesterday|gisteren|hier/.test(lower)) dt.setDate(dt.getDate() - 1);
    else if (/last\s+week/.test(lower)) dt.setDate(dt.getDate() - 7);
    else if (/last\s+month/.test(lower)) dt.setMonth(dt.getMonth() - 1);
    else if (/last\s+year/.test(lower)) dt.setFullYear(dt.getFullYear() - 1);
    else if (/next\s+week/.test(lower)) dt.setDate(dt.getDate() + 7);
    else if (/next\s+month/.test(lower)) dt.setMonth(dt.getMonth() + 1);
    else if (/next\s+year/.test(lower)) dt.setFullYear(dt.getFullYear() + 1);
    return dt.toISOString().slice(0, 10);
  }
  return undefined;
}

function daysBetween(from: Date, isoTo: string): number {
  const to = new Date(isoTo);
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Chronology - one entry per detected date phrase, anchored to its message.
// ---------------------------------------------------------------------------

const SENTENCE_SPLIT_RX = /(?<=[.!?])\s+|\n+/;

export function extractChronology(messages: IntakeMessage[]): ChronologyEntry[] {
  const out: ChronologyEntry[] = [];
  for (const m of messages) {
    if (m.role !== "user") continue;
    const sentences = m.content_redacted.split(SENTENCE_SPLIT_RX).filter(Boolean);
    for (const s of sentences) {
      const dateMatch =
        s.match(ISO_DATE_RX) || s.match(DMY_DATE_RX) || s.match(RELATIVE_RX) || s.match(NAMED_DAY_RX);
      if (!dateMatch) continue;
      const dateText = dateMatch[0];
      out.push({
        id: `chr-${m.sequence_no}-${out.length}`,
        dateText,
        dateIso: tryParseDate(dateText),
        event: s.trim().length > 200 ? `${s.trim().slice(0, 197)}…` : s.trim(),
        source: makeUserSource(m, s),
      });
    }
  }
  // Sort by ISO date when available; entries without ISO go last in encounter order.
  return out.sort((a, b) => {
    if (a.dateIso && b.dateIso) return a.dateIso.localeCompare(b.dateIso);
    if (a.dateIso) return -1;
    if (b.dateIso) return 1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Parties roster
// ---------------------------------------------------------------------------

const ROLE_PATTERNS: Array<{ rx: RegExp; role: PartyRole; relationship?: string; kind?: PartyEntry["kind"] }> = [
  { rx: /\b(my\s+(employer|werkgever|employeur))\b/i, role: "opposing_party", relationship: "employer", kind: "company" },
  { rx: /\b(my\s+(landlord|verhuurder|propriétaire))\b/i, role: "opposing_party", relationship: "landlord" },
  { rx: /\b(my\s+(tenant|huurder|locataire))\b/i, role: "opposing_party", relationship: "tenant" },
  { rx: /\b(my\s+(spouse|wife|husband|partner|echtgen(?:oot|ote)|conjoint(?:e)?))\b/i, role: "opposing_party", relationship: "spouse / partner" },
  { rx: /\b(my\s+(neighbour|neighbor|buur|voisin))\b/i, role: "opposing_party", relationship: "neighbour" },
  { rx: /\b(opposing\s+(party|counsel)|tegenpartij|partie\s+adverse)\b/i, role: "opposing_party" },
  { rx: /\b(opposing\s+counsel|advocaat\s+van\s+de\s+tegenpartij|avocat\s+adverse)\b/i, role: "opposing_counsel" },
  { rx: /\b(witness|getuige|témoin)\b/i, role: "witness" },
  { rx: /\b(insurer|insurance\s+company|verzekeraar|assureur)\b/i, role: "insurer", kind: "company" },
  { rx: /\b(police|politie|prosecutor|parket|procureur|judge|rechter|juge|court|rechtbank|tribunal|notary|notaris|notaire)\b/i, role: "court_or_authority", kind: "authority" },
  { rx: /\b(expert|deskundige)\b/i, role: "expert" },
];

const COMPANY_RX = /\b([A-Z][\w&.'-]+(?:\s+[A-Z][\w&.'-]+){0,3})\s+(NV|BV|BVBA|SA|SRL|SARL|GmbH|Ltd|Inc|VZW|ASBL)\b/g;
const TITLED_NAME_RX =
  /\b(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Meester|Maître|Mevr\.?|Mw\.?|Dhr\.?|M\.?|Mme)\s+([A-Z][a-zàâçéèêëîïôûùüÿñ]+(?:\s+[A-Z][a-zàâçéèêëîïôûùüÿñ]+){0,2})\b/g;

export function extractParties(messages: IntakeMessage[]): PartyEntry[] {
  const collected: PartyEntry[] = [];
  let counter = 0;
  for (const m of messages) {
    if (m.role !== "user") continue;
    const text = m.content_redacted;

    for (const { rx, role, relationship, kind } of ROLE_PATTERNS) {
      const match = text.match(rx);
      if (match) {
        collected.push({
          id: `party-${counter++}`,
          role,
          name: match[0].replace(/^my\s+/i, "the "),
          kind: kind ?? "individual",
          relationship,
          source: makeUserSource(m, match[0]),
        });
      }
    }

    let companyMatch: RegExpExecArray | null;
    while ((companyMatch = COMPANY_RX.exec(text)) !== null) {
      collected.push({
        id: `party-${counter++}`,
        role: "opposing_party",
        name: companyMatch[0],
        kind: "company",
        source: makeUserSource(m, companyMatch[0]),
      });
    }

    let nameMatch: RegExpExecArray | null;
    while ((nameMatch = TITLED_NAME_RX.exec(text)) !== null) {
      collected.push({
        id: `party-${counter++}`,
        role: "third_party",
        name: nameMatch[0],
        kind: "individual",
        source: makeUserSource(m, nameMatch[0]),
      });
    }
  }

  return uniqueBy(collected, (p) => p.name, 16);
}

// ---------------------------------------------------------------------------
// Issues & case theory
// ---------------------------------------------------------------------------

const PRACTICE_AREA_HINTS: Array<{ area: PracticeAreaSuggestion; rx: RegExp; question: string }> = [
  {
    area: "Family",
    rx: /\b(divorce|custody|child support|alimony|marriage|separation|adoption|scheid|alimentatie|garde\s+d'enfants|pension\s+alimentaire)\b/i,
    question: "How should the family-law issue be resolved (custody / division / support)?",
  },
  {
    area: "Criminal",
    rx: /\b(criminal|arrest|police|charge|prosecut|jail|sentence|fine|trafficking|misdaad|aanhouding|veroordeling|pénal|infraction|condamnation)\b/i,
    question: "What is the criminal exposure and what defence is available?",
  },
  {
    area: "Employment",
    rx: /\b(employer|employee|fired|dismiss|salary|wage|notice|labor|union|werkgever|ontslag|loon|opzeg|employeur|licenciement|salaire)\b/i,
    question: "Was the dismissal / employment action procedurally lawful?",
  },
  {
    area: "Real estate / Construction",
    rx: /\b(real\s+estate|property|building|construction|deed|mortgage|notary|onroerend|gebouw|bouw|hypotheek|notaris|immobilier|propriété|construction|hypothèque|notaire)\b/i,
    question: "What rights or remedies arise from the property / construction matter?",
  },
  {
    area: "Traffic",
    rx: /\b(traffic|driving|accident|car|vehicle|license|verkeer|rijbewijs|ongeval|verzekering|trafic|conduite|accident|véhicule|permis)\b/i,
    question: "Liability and insurance coverage for the traffic incident.",
  },
  {
    area: "Rental disputes",
    rx: /\b(rent|lease|landlord|tenant|eviction|deposit|huur|verhuurder|huurder|loyer|bail|locataire|propriétaire)\b/i,
    question: "Lease performance / deposit / eviction question - which side is in default?",
  },
  {
    area: "Debt collection",
    rx: /\b(debt|collection|owed|invoice|payment|creditor|debtor|schuld|incasso|factuur|betaling|dette|recouvrement|facture|paiement|créancier)\b/i,
    question: "Recoverability of the debt and best collection route.",
  },
  {
    area: "Commercial",
    rx: /\b(contract|business|company|commercial|trade|partnership|shareholder|onderneming|handel|aandeelhouder|société|entreprise|commerce|associé)\b/i,
    question: "What contractual rights or commercial remedies are available?",
  },
  {
    area: "Civil",
    rx: /\b(civil|liability|damages|tort|injury|burgerlijk|aansprakelijk|schade|civil|responsabilité|dommage)\b/i,
    question: "Civil-liability claim - duty, breach, damage, causation.",
  },
];

export function inferIssues(messages: IntakeMessage[]): LegalIssue[] {
  const userText = messages.filter((m) => m.role === "user").map((m) => m.content_redacted).join("\n");
  const out: LegalIssue[] = [];
  let counter = 0;
  for (const { area, rx, question } of PRACTICE_AREA_HINTS) {
    if (!rx.test(userText)) continue;
    out.push({
      id: `issue-${counter++}`,
      question,
      area,
      strength: "UNKNOWN",
      openQuestions: deriveOpenQuestionsForArea(area, userText),
    });
  }
  if (out.length === 0) {
    out.push({
      id: "issue-general",
      question: "Identify the legal issue and the appropriate remedy.",
      area: "General",
      strength: "UNKNOWN",
      openQuestions: ["Confirm what outcome the visitor is seeking."],
    });
  }
  return out;
}

function deriveOpenQuestionsForArea(area: PracticeAreaSuggestion, text: string): string[] {
  const qs: string[] = [];
  if (!/€|\beur\b|\bdamage|\bschade|\bdommage/i.test(text)) qs.push("Quantify the financial stake.");
  if (area === "Employment" && !/\b(notice|opzeg|préavis)\b/i.test(text)) qs.push("Confirm notice period observed.");
  if (area === "Rental disputes" && !/\b(deposit|waarborg|garantie\s+locative)\b/i.test(text)) qs.push("Confirm deposit amount and status.");
  if (area === "Family" && !/\b(child|kind|enfant)\b/i.test(text)) qs.push("Are minor children involved?");
  if (area === "Real estate / Construction" && !/\b(notary|notaris|notaire)\b/i.test(text)) qs.push("Was a notary involved?");
  if (area === "Traffic" && !/\b(insurance|verzekering|assurance)\b/i.test(text)) qs.push("Confirm insurance coverage.");
  return qs;
}

// ---------------------------------------------------------------------------
// Procedural deadlines & SOL detection
// ---------------------------------------------------------------------------

const DEADLINE_KIND_HINTS: Array<{ rx: RegExp; kind: DeadlineKind; isHardStop: boolean }> = [
  { rx: /\b(hearing|zitting|audience|pleidooi|plaidoirie)\b/i, kind: "court_hearing", isHardStop: true },
  { rx: /\b(summons|dagvaarding|citation|signification)\b/i, kind: "filing_deadline", isHardStop: true },
  { rx: /\b(deadline|termijn|délai|échéance|expir)\b/i, kind: "filing_deadline", isHardStop: true },
  { rx: /\b(reply|antwoord|réponse)\s+by\b/i, kind: "response_deadline", isHardStop: true },
  { rx: /\b(appointment|afspraak|rendez[- ]vous)\b/i, kind: "appointment", isHardStop: false },
];

const SOL_KEYWORDS = /\b(verjaring|prescription|statute\s+of\s+limitations|limitation\s+period)\b/i;

export function extractProcedural(messages: IntakeMessage[], now: Date = new Date()): ProceduralEntry[] {
  const out: ProceduralEntry[] = [];
  let counter = 0;
  for (const m of messages) {
    if (m.role !== "user") continue;
    const sentences = m.content_redacted.split(SENTENCE_SPLIT_RX).filter(Boolean);
    for (const s of sentences) {
      const dateMatch =
        s.match(ISO_DATE_RX) || s.match(DMY_DATE_RX) || s.match(RELATIVE_RX) || s.match(NAMED_DAY_RX);
      const isSol = SOL_KEYWORDS.test(s);
      if (!dateMatch && !isSol) continue;
      let kind: DeadlineKind = "other";
      let isHardStop = false;
      for (const hint of DEADLINE_KIND_HINTS) {
        if (hint.rx.test(s)) {
          kind = hint.kind;
          isHardStop = hint.isHardStop;
          break;
        }
      }
      if (isSol) {
        kind = "statute_of_limitations";
        isHardStop = true;
      }
      const dateText = dateMatch ? dateMatch[0] : "unspecified";
      const dateIso = dateMatch ? tryParseDate(dateText, now) : undefined;
      out.push({
        id: `proc-${counter++}`,
        kind,
        dateText,
        dateIso,
        description: s.trim().length > 200 ? `${s.trim().slice(0, 197)}…` : s.trim(),
        daysFromNow: dateIso ? daysBetween(now, dateIso) : undefined,
        isHardStop,
        source: makeUserSource(m, s),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Damages computation
// ---------------------------------------------------------------------------

const MONEY_RX = /(€\s*[\d.,]+|[\d.,]+\s*(?:€|euro|eur|usd|dollars?))/gi;

function parseEuroAmountToMinor(raw: string): number | undefined {
  const match = raw.match(/[\d.,]+/);
  if (!match) return undefined;
  let txt = match[0];
  // "12.500" Belgian thousands → "12500"; "12,50" Belgian decimal → "12.50".
  if (/,\d{1,2}$/.test(txt)) {
    txt = txt.replace(/\./g, "").replace(",", ".");
  } else {
    txt = txt.replace(/[.,](?=\d{3}\b)/g, "");
    txt = txt.replace(",", ".");
  }
  const n = Number(txt);
  if (!isFinite(n)) return undefined;
  return Math.round(n * 100);
}

function classifyDamage(context: string): DamageCategory {
  if (/\b(invoice|factuur|facture|salary|loon|salaire|medical|medische|médical|out\s*-?\s*of\s*-?\s*pocket)\b/i.test(context)) return "economic_specials";
  if (/\b(pain|suffering|moral|smart|emotional|distress|loss\s+of\s+enjoyment|verdriet)\b/i.test(context)) return "general";
  if (/\b(contract|breach|wanprestatie|breuk|rupture)\b/i.test(context)) return "contractual";
  if (/\b(penalt|interest|verwijl|intérêts|moratoir|moratoire)\b/i.test(context)) return "penalties_or_interest";
  return "unknown";
}

export function extractDamages(messages: IntakeMessage[]): { entries: DamageEntry[]; totalEurMinor: number | null; claimedTexts: string[] } {
  const entries: DamageEntry[] = [];
  const claimedTexts: string[] = [];
  let counter = 0;
  for (const m of messages) {
    if (m.role !== "user") continue;
    const sentences = m.content_redacted.split(SENTENCE_SPLIT_RX).filter(Boolean);
    for (const s of sentences) {
      const matches = s.match(MONEY_RX);
      if (!matches) continue;
      for (const raw of matches) {
        claimedTexts.push(raw);
        entries.push({
          id: `dmg-${counter++}`,
          category: classifyDamage(s),
          description: s.trim().length > 160 ? `${s.trim().slice(0, 157)}…` : s.trim(),
          amountText: raw.trim(),
          amountEurMinor: parseEuroAmountToMinor(raw),
          source: makeUserSource(m, s),
        });
      }
    }
  }
  const totalEurMinor = entries.reduce<number | null>((acc, e) => {
    if (e.amountEurMinor === undefined) return acc;
    return (acc ?? 0) + e.amountEurMinor;
  }, null);
  return { entries, totalEurMinor, claimedTexts };
}

// ---------------------------------------------------------------------------
// Exhibits
// ---------------------------------------------------------------------------

function classifyExhibit(filename: string, mime: string): { classification: ExhibitClassification; oneLiner: string } {
  const lower = filename.toLowerCase();
  if (/contract|contrat|overeenkomst/.test(lower)) return { classification: "contract", oneLiner: "Contract or agreement" };
  if (/invoice|factuur|facture/.test(lower)) return { classification: "invoice", oneLiner: "Invoice" };
  if (/letter|brief|lettre/.test(lower)) return { classification: "letter", oneLiner: "Letter or correspondence" };
  if (/summons|dagvaard|citation|signification/.test(lower)) return { classification: "summons", oneLiner: "Summons / formal notice" };
  if (/order|vonnis|jugement|arrest/.test(lower)) return { classification: "court_order", oneLiner: "Court order or judgment" };
  if (/photo|foto|image|jpg|jpeg|png|heic/.test(lower) || mime.startsWith("image/")) return { classification: "photo", oneLiner: "Photograph" };
  if (/passport|id|identiteit|carte\s+identite|kbo|rrn|nrn/.test(lower)) return { classification: "id_document", oneLiner: "Identification document" };
  if (/bank|statement|rekening|relevé/.test(lower)) return { classification: "bank_record", oneLiner: "Bank record" };
  if (/email|mail|whatsapp|sms|chat/.test(lower)) return { classification: "communication", oneLiner: "Communication record" };
  if (/policy|terms|voorwaarden|cgv/.test(lower)) return { classification: "policy_or_terms", oneLiner: "Policy or terms" };
  if (/expert|report|rapport|verslag/.test(lower)) return { classification: "report_or_expert", oneLiner: "Report or expert opinion" };
  return { classification: "other", oneLiner: mime.startsWith("application/pdf") ? "PDF document" : "Supporting document" };
}

export function extractExhibits(files: Array<Pick<IntakeFile, "original_filename" | "mime_type" | "storage_status">>): ExhibitEntry[] {
  return files.map((f, i) => {
    const { classification, oneLiner } = classifyExhibit(f.original_filename, f.mime_type);
    const ref = `P-${String(i + 1).padStart(3, "0")}`;
    return {
      ref,
      filename: f.original_filename,
      mimeType: f.mime_type,
      classification,
      oneLiner,
      uploadStatus: f.storage_status,
      introducedBy: makeDocSource(f),
    };
  });
}

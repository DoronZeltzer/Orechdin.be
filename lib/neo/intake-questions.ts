/**
 * Conversational interview prompts for the intake ladder.
 *
 * Goal: when NEO is in DRAFT_CASE_BUILDING and the metacognitive evaluator
 * reports a missing fact (timeline, parties, location, files), pick ONE
 * warm, locale-aware question to weave into the next reply — instead of
 * dumping a generic chip rail at every turn.
 *
 * The questions are written in the "two friends working on a project" voice
 * codified in lib/neo/persona.ts. No legal language. No interrogation tone.
 *
 * Adaptive batching: when the visitor's last message is short or contains
 * stress signals, ask exactly one thing. When they wrote at length and gave
 * detail, the helper may emit a paired prompt covering two related gaps.
 */

import type { Locale } from "./legal-reply";
import type { MetacognitiveReport } from "./intake-state";

export type InterviewStyle = "adaptive" | "one-at-a-time" | "batched";

export type MissingFact =
  | "issue"
  | "timeline"
  | "parties"
  | "location"
  | "documents"
  | "none";

export interface NextQuestion {
  /** Single-sentence prompt to weave into NEO's reply. */
  prompt: string;
  /** What the question is trying to fill. Useful for telemetry / UI hints. */
  targets: MissingFact[];
  /** True when the helper combined two related gaps into one ask. */
  batched: boolean;
}

/** Lightweight stress detector — informs the adaptive style. */
function looksStressed(lastUserMessage: string): boolean {
  const t = (lastUserMessage || "").toLowerCase();
  if (!t.trim()) return false;
  return /(urgent|asap|today|tomorrow|deadline|summons|dagvaarding|police|politie|arrest|hearing|audience|scared|afraid|worried|panic|help me|please help)/i.test(
    t,
  );
}

/** Returns the first missing fact in the order we want to ask. */
function pickPrimary(report: MetacognitiveReport, fileCount: number): MissingFact {
  if (report.missingCritical.some((m) => /core problem/i.test(m))) return "issue";
  if (report.missingCritical.some((m) => /timeline|date/i.test(m))) return "timeline";
  if (report.missingCritical.some((m) => /parties/i.test(m))) return "parties";
  // Location and documents are not surfaced as "critical" by the evaluator,
  // so we infer them from knownFacts and file count.
  if (report.knownFacts < 3) return "location";
  if (fileCount === 0) return "documents";
  return "none";
}

/** Picks an optional secondary fact that pairs naturally with the primary. */
function pickSecondary(primary: MissingFact, report: MetacognitiveReport): MissingFact {
  if (primary === "timeline") {
    return report.missingCritical.some((m) => /parties/i.test(m)) ? "parties" : "none";
  }
  if (primary === "parties") {
    return report.knownFacts < 3 ? "location" : "none";
  }
  return "none";
}

const PROMPTS: Record<MissingFact, Record<Locale, string>> = {
  issue: {
    en: "Could you tell me, in your own words, what's going on?",
    nl: "Kunt u in uw eigen woorden vertellen wat er aan de hand is?",
    fr: "Pourriez-vous me raconter, avec vos propres mots, ce qui se passe ?",
  },
  timeline: {
    en: "Roughly when did this start, or when did the last thing happen?",
    nl: "Wanneer is dit ongeveer begonnen, of wanneer is het laatste gebeurd?",
    fr: "À peu près quand est-ce que cela a commencé, ou quand le dernier fait s'est-il produit ?",
  },
  parties: {
    en: "Who else is involved — a person, a company, an institution?",
    nl: "Wie is er nog betrokken — een persoon, een bedrijf, een instelling?",
    fr: "Qui d'autre est impliqué — une personne, une entreprise, une institution ?",
  },
  location: {
    en: "Where did this take place — Antwerp, somewhere else in Belgium?",
    nl: "Waar is dit gebeurd — Antwerpen, ergens anders in België?",
    fr: "Où cela s'est-il passé — Anvers, ailleurs en Belgique ?",
  },
  documents: {
    en: "Anything in writing — letters, contracts, emails? Drop them here whenever you're ready.",
    nl: "Heeft u iets op papier — brieven, contracten, e-mails? Laat het hier vallen wanneer u klaar bent.",
    fr: "Avez-vous des écrits — lettres, contrats, courriels ? Déposez-les ici quand vous êtes prêt.",
  },
  none: { en: "", nl: "", fr: "" },
};

const PAIRED: Partial<Record<`${MissingFact}+${MissingFact}`, Record<Locale, string>>> = {
  "timeline+parties": {
    en: "Roughly when did this start, and who else is involved?",
    nl: "Wanneer is dit ongeveer begonnen, en wie is er nog betrokken?",
    fr: "Quand cela a-t-il commencé, et qui d'autre est impliqué ?",
  },
  "parties+location": {
    en: "Who else is involved, and where did this take place?",
    nl: "Wie is er nog betrokken, en waar is dit gebeurd?",
    fr: "Qui d'autre est impliqué, et où cela s'est-il passé ?",
  },
};

export function nextBestQuestion(args: {
  report: MetacognitiveReport;
  fileCount: number;
  lastUserMessage: string;
  locale: Locale;
  style?: InterviewStyle;
}): NextQuestion | null {
  const { report, fileCount, lastUserMessage, locale, style = "adaptive" } = args;

  const primary = pickPrimary(report, fileCount);
  if (primary === "none") return null;

  const wordCount = (lastUserMessage || "").trim().split(/\s+/).filter(Boolean).length;
  const stressed = looksStressed(lastUserMessage);

  let useBatched = false;
  if (style === "batched") useBatched = true;
  else if (style === "one-at-a-time") useBatched = false;
  else useBatched = !stressed && wordCount >= 18;

  if (useBatched) {
    const secondary = pickSecondary(primary, report);
    if (secondary !== "none") {
      const key = `${primary}+${secondary}` as keyof typeof PAIRED;
      const paired = PAIRED[key];
      if (paired) {
        return { prompt: paired[locale], targets: [primary, secondary], batched: true };
      }
    }
  }

  return { prompt: PROMPTS[primary][locale], targets: [primary], batched: false };
}

/**
 * Lightweight gap-checker for the dossier sidebar — surfaces all currently
 * missing facts (not just the next one to ask).
 */
export function listOpenGaps(report: MetacognitiveReport, fileCount: number, locale: Locale): string[] {
  const gaps: MissingFact[] = [];
  if (report.missingCritical.some((m) => /core problem/i.test(m))) gaps.push("issue");
  if (report.missingCritical.some((m) => /timeline|date/i.test(m))) gaps.push("timeline");
  if (report.missingCritical.some((m) => /parties/i.test(m))) gaps.push("parties");
  if (report.knownFacts < 3) gaps.push("location");
  if (fileCount === 0) gaps.push("documents");

  const labels: Record<MissingFact, Record<Locale, string>> = {
    issue: { en: "Core issue", nl: "Kernprobleem", fr: "Problème central" },
    timeline: { en: "Timeline", nl: "Tijdlijn", fr: "Chronologie" },
    parties: { en: "Parties involved", nl: "Betrokken partijen", fr: "Parties impliquées" },
    location: { en: "Jurisdiction", nl: "Rechtsgebied", fr: "Juridiction" },
    documents: { en: "Supporting documents", nl: "Stavingsstukken", fr: "Pièces justificatives" },
    none: { en: "", nl: "", fr: "" },
  };

  return gaps.map((g) => labels[g][locale]).filter(Boolean);
}

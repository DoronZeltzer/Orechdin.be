/**
 * CaseFile builder - turns a transcript + uploaded files into the rich
 * structured case file a partner can pick up cold.
 *
 * Composes the deterministic extractors in case-file-extractors.ts and the
 * existing conflict heuristics in conflict-flag.ts into the CaseFile shape
 * defined in case-file-types.ts.
 *
 * Pure: takes inputs, returns a CaseFile. No I/O, no LLM call.
 */

import type { IntakeMessage, IntakeFile } from "./intake-types";
import { detectConflictFlags } from "./conflict-flag";
import {
  extractChronology,
  extractDamages,
  extractExhibits,
  extractParties,
  extractProcedural,
  inferIssues,
} from "./case-file-extractors";
import type {
  CaseFile,
  CaseFileCover,
  CaseFilePreview,
  ExecutiveSummary,
  OvbAllocation,
  RiskGate,
  UrgencyTier,
} from "./case-file-types";
import { LAWYERS } from "@/lib/site";
import { PUBLISHED_PRACTICE_AREAS, type PracticeAreaSuggestion } from "./intake-summary";

// ---------------------------------------------------------------------------
// Cover heuristics
// ---------------------------------------------------------------------------

const URGENCY_HARD_RX =
  /\b(urgent|asap|today|tomorrow|deadline|summons|dagvaarding|police|politie|arrest|hearing|audience|emergency|noodgeval|verjaring|prescription)\b/i;

function pickPracticeArea(messages: IntakeMessage[], inferred: string | undefined): string {
  if (inferred && (PUBLISHED_PRACTICE_AREAS as readonly string[]).includes(inferred)) return inferred;
  return inferred || "General";
}

function pickSuggestedLead(area: string): string | undefined {
  const lower = area.toLowerCase();
  // Mapping is faithful to lib/site.ts bios - no invention.
  if (/(real estate|construction|commercial|business|debt|civil)/.test(lower)) return LAWYERS[0]?.name;
  if (/(family|criminal|employment|traffic|privacy)/.test(lower)) return LAWYERS[1]?.name;
  return undefined;
}

function buildCaption(messages: IntakeMessage[], area: string): string {
  const firstUser = messages.find((m) => m.role === "user")?.content_redacted ?? "";
  const headline = firstUser.split(/[.!?\n]/)[0].trim();
  const trimmed = headline.length > 60 ? `${headline.slice(0, 57)}…` : headline;
  return trimmed ? `${area} - ${trimmed}` : `${area} matter`;
}

function buildTheme(messages: IntakeMessage[], firstChronologyEvent?: string): string {
  const userTurns = messages.filter((m) => m.role === "user");
  if (userTurns.length === 0) return "Visitor opened intake but did not yet describe the matter.";
  // Synthesise the visitor's stake as one sentence - quote-led so we can never invent.
  const first = userTurns[0].content_redacted.replace(/\s+/g, " ").trim();
  const seed = firstChronologyEvent ?? first;
  const trimmed = seed.length > 180 ? `${seed.slice(0, 177)}…` : seed;
  return `Visitor's account: "${trimmed}"`;
}

function pickUrgency(args: { messages: IntakeMessage[]; hasHardStop: boolean; fileCount: number }): UrgencyTier {
  const text = args.messages.map((m) => m.content_redacted).join(" ");
  if (args.hasHardStop) return "CRITICAL";
  if (URGENCY_HARD_RX.test(text)) return "HIGH";
  if (args.fileCount > 0) return "MEDIUM";
  return "LOW";
}

function buildCover(args: {
  matterId: string;
  language: string;
  messages: IntakeMessage[];
  area: string;
  urgency: UrgencyTier;
  nextDeadline?: string;
  solAlert?: string;
  firstEvent?: string;
}): CaseFileCover {
  return {
    matterId: args.matterId,
    caption: buildCaption(args.messages, args.area),
    theme: buildTheme(args.messages, args.firstEvent),
    practiceArea: args.area,
    status: "DRAFT",
    urgency: args.urgency,
    language: args.language,
    openedAt: new Date().toISOString(),
    suggestedLead: pickSuggestedLead(args.area),
    nextDeadline: args.nextDeadline,
    statuteOfLimitationsAlert: args.solAlert,
  };
}

// ---------------------------------------------------------------------------
// Executive summary - deterministic, quote-led so NEO never invents.
// ---------------------------------------------------------------------------

function buildExecutiveSummary(args: {
  caption: string;
  area: string;
  partyCount: number;
  chronologyCount: number;
  exhibitCount: number;
  damagesText: string;
  firstUserSentence: string;
  hasJurisdiction: boolean;
}): ExecutiveSummary {
  const parts: string[] = [];
  parts.push(`Matter: ${args.caption}.`);
  if (args.firstUserSentence) {
    const trimmed =
      args.firstUserSentence.length > 220
        ? `${args.firstUserSentence.slice(0, 217)}…`
        : args.firstUserSentence;
    parts.push(`Visitor's own words: "${trimmed}"`);
  }
  parts.push(
    `Practice area suggested: ${args.area}. ${args.partyCount} part${args.partyCount === 1 ? "y" : "ies"} mentioned, ${args.chronologyCount} timeline event${args.chronologyCount === 1 ? "" : "s"}, ${args.exhibitCount} document${args.exhibitCount === 1 ? "" : "s"} attached.`,
  );
  if (args.damagesText) parts.push(`Stakes claimed: ${args.damagesText}.`);
  if (!args.hasJurisdiction) parts.push("Jurisdiction not yet confirmed.");

  const bullets: string[] = [
    `Suggested area: ${args.area}`,
    `${args.partyCount} party / parties named`,
    `${args.chronologyCount} timeline event${args.chronologyCount === 1 ? "" : "s"}`,
    `${args.exhibitCount} document${args.exhibitCount === 1 ? "" : "s"} attached`,
  ];
  if (args.damagesText) bullets.push(`Stakes: ${args.damagesText}`);

  return { paragraph: parts.join(" "), bullets };
}

// ---------------------------------------------------------------------------
// Risk gate
// ---------------------------------------------------------------------------

const SENSITIVE_RX =
  /\b(asylum|immigration\s+tribunal|deportation|war\s+crime|terrorism|child\s+protection|domestic\s+violence|sexual\s+assault|minor\s+victim|mineur)\b/i;
const JURISDICTION_RX =
  /\b(united\s+states|us\s+federal|california|new\s+york|texas|france\s+only|paris\s+court|tribunal\s+de\s+paris|netherlands\s+court|amsterdam\s+court|german\s+court|deutschland\s+gericht)\b/i;
const CONCURRENT_COUNSEL_RX =
  /\b(another\s+(lawyer|advocaat|avocat)|other\s+counsel|i\s+already\s+have\s+a\s+lawyer|j'ai\s+déjà\s+un\s+avocat|al\s+een\s+advocaat)\b/i;

function buildRiskGate(args: { transcriptText: string; documentNames: string[] }): RiskGate {
  const conflictFlags = detectConflictFlags({ transcriptText: args.transcriptText, documentNames: args.documentNames });
  const sensitiveMatter = SENSITIVE_RX.test(args.transcriptText);
  const jurisdictionRisk = JURISDICTION_RX.test(args.transcriptText);
  const concurrentCounselMentioned = CONCURRENT_COUNSEL_RX.test(args.transcriptText);

  const preEngagementChecks: string[] = [];
  if (conflictFlags.length > 0) preEngagementChecks.push("Run formal conflict-of-interest check against the firm's client list before opening.");
  if (sensitiveMatter) preEngagementChecks.push("Apply the firm's sensitive-matter intake protocol (privacy, supervision, supplementary consent).");
  if (jurisdictionRisk) preEngagementChecks.push("Confirm Belgian jurisdiction; engage specialist counsel for any foreign elements per firm policy.");
  if (concurrentCounselMentioned) preEngagementChecks.push("Confirm visitor is not concurrently represented before accepting the file.");
  preEngagementChecks.push("Send and countersign the engagement letter / opdrachtbevestiging before any substantive work.");

  return { conflictFlags, sensitiveMatter, jurisdictionRisk, concurrentCounselMentioned, preEngagementChecks };
}

// ---------------------------------------------------------------------------
// OVB allocation - maps each generated artefact to one of the four folders.
// Source: OVB Behandeling dossier (kwaliteitshandboek). Strictly procedural,
// not legal advice.
// ---------------------------------------------------------------------------

function buildOvbAllocation(args: { exhibitCount: number; hasProcedural: boolean }): OvbAllocation[] {
  const out: OvbAllocation[] = [
    { label: "Cover & executive summary", folder: "01_Intake", rationale: "Opens the dossier - partner's first read." },
    { label: "Parties roster", folder: "01_Intake", rationale: "Identity & relationships, basis for conflict check." },
    { label: "Risk & conflict gate", folder: "01_Intake", rationale: "Pre-engagement checks per OVB Codex Deontologie Deel III, Hfst. 1." },
    { label: "Issues list & case theory", folder: "01_Intake", rationale: "Internal working theory of the matter, lawyer-only." },
    { label: "Conversation transcript", folder: "02_Communicatie", rationale: "Verbatim record of the intake exchange with the visitor." },
  ];
  if (args.exhibitCount > 0) {
    out.push({ label: "Exhibit index & attached documents", folder: "04_Overige_stukken", rationale: "Client-supplied evidence pending classification by lawyer." });
  }
  if (args.hasProcedural) {
    out.push({ label: "Procedural posture & deadlines", folder: "03_Processtukken", rationale: "Scheduled hearings, filing deadlines, statutes-of-limitation alerts." });
  }
  out.push({ label: "Damages computation", folder: "01_Intake", rationale: "Working stake estimate; lawyer to validate." });
  return out;
}

// ---------------------------------------------------------------------------
// Completeness scoring - same gauges the dossier panel already uses, plus
// a 0–100 overall score so the UI can show a single bar.
// ---------------------------------------------------------------------------

function buildCompleteness(args: {
  hasIssue: boolean;
  hasTimeline: boolean;
  hasParties: boolean;
  hasLocation: boolean;
  hasStakes: boolean;
  fileCount: number;
}): CaseFile["completeness"] {
  const weights = {
    hasIssue: 20,
    hasTimeline: 20,
    hasParties: 20,
    hasLocation: 15,
    hasStakes: 15,
    files: 10,
  };
  let score = 0;
  if (args.hasIssue) score += weights.hasIssue;
  if (args.hasTimeline) score += weights.hasTimeline;
  if (args.hasParties) score += weights.hasParties;
  if (args.hasLocation) score += weights.hasLocation;
  if (args.hasStakes) score += weights.hasStakes;
  if (args.fileCount > 0) score += weights.files;
  return { ...args, score };
}

// ---------------------------------------------------------------------------
// Top-level builder
// ---------------------------------------------------------------------------

export interface BuildCaseFileInput {
  matterId: string;
  language: string;
  messages: IntakeMessage[];
  files: Array<Pick<IntakeFile, "original_filename" | "mime_type" | "storage_status">>;
}

export function buildCaseFile(input: BuildCaseFileInput): CaseFile {
  const { matterId, language, messages, files } = input;

  const userText = messages.filter((m) => m.role === "user").map((m) => m.content_redacted).join("\n");
  const allText = messages.map((m) => m.content_redacted).join("\n");
  const firstUserSentence = (messages.find((m) => m.role === "user")?.content_redacted ?? "")
    .split(/[.!?\n]/)[0]
    .trim();

  const chronology = extractChronology(messages);
  const parties = extractParties(messages);
  const procedural = extractProcedural(messages);
  const damages = extractDamages(messages);
  const issues = inferIssues(messages);
  const exhibits = extractExhibits(files);

  const hasJurisdiction =
    /\b(antwerp|antwerpen|brussels|bruxelles|brussel|ghent|gent|leuven|liège|liege|namur|charleroi|mechelen|hasselt|bruges|brugge|belgium|belgië|belgique|flanders|vlaanderen|wallonia|wallonie)\b/i.test(
      userText,
    );

  const rawArea = issues[0]?.area ?? "General";
  const area = pickPracticeArea(messages, rawArea);

  const solEntry = procedural.find((p) => p.kind === "statute_of_limitations");
  const nextHardStop = procedural
    .filter((p) => p.isHardStop && p.dateIso)
    .sort((a, b) => (a.dateIso! < b.dateIso! ? -1 : 1))[0];

  const urgency = pickUrgency({ messages, hasHardStop: !!nextHardStop, fileCount: files.length });

  const cover = buildCover({
    matterId,
    language,
    messages,
    area,
    urgency,
    nextDeadline: nextHardStop?.dateText,
    solAlert: solEntry ? `Statute-of-limitations cue detected: "${solEntry.description}". Confirm the running deadline.` : undefined,
    firstEvent: chronology[0]?.event,
  });

  const damagesText =
    damages.totalEurMinor !== null
      ? `≈ €${(damages.totalEurMinor / 100).toLocaleString("en-BE", { maximumFractionDigits: 0 })}`
      : damages.claimedTexts.length > 0
        ? damages.claimedTexts.slice(0, 3).join(", ")
        : "";

  const executiveSummary = buildExecutiveSummary({
    caption: cover.caption,
    area,
    partyCount: parties.length,
    chronologyCount: chronology.length,
    exhibitCount: exhibits.length,
    damagesText,
    firstUserSentence,
    hasJurisdiction,
  });

  const caseTheory = {
    legalTheory: `Working hypothesis: ${area}. Final classification by the lawyer.`,
    factualTheory:
      chronology.length > 0
        ? `${chronology.length} reported event${chronology.length === 1 ? "" : "s"}, beginning around ${chronology[0].dateText}.`
        : "Facts pending - visitor has not yet shared a clear sequence of events.",
    persuasiveTheory: damagesText
      ? `Tangible stakes for the visitor (${damagesText}); their account suggests they are seeking accountability and a workable resolution.`
      : "Visitor is seeking orientation; persuasive frame to be developed once stakes are confirmed.",
  };

  const risk = buildRiskGate({ transcriptText: allText, documentNames: files.map((f) => f.original_filename) });

  const ovbAllocation = buildOvbAllocation({ exhibitCount: exhibits.length, hasProcedural: procedural.length > 0 });

  const completeness = buildCompleteness({
    hasIssue: messages.some((m) => m.role === "user"),
    hasTimeline: chronology.length > 0,
    hasParties: parties.length > 0,
    hasLocation: hasJurisdiction,
    hasStakes: damages.entries.length > 0,
    fileCount: files.length,
  });

  const openQuestionsForLawyer: string[] = [];
  if (chronology.length === 0) openQuestionsForLawyer.push("Confirm timeline / dates of key events.");
  if (parties.length === 0) openQuestionsForLawyer.push("Identify all parties involved (full names, role).");
  if (!hasJurisdiction) openQuestionsForLawyer.push("Confirm jurisdiction (Antwerp, elsewhere in Belgium, foreign).");
  if (damages.entries.length === 0) openQuestionsForLawyer.push("Confirm monetary stakes / damages claimed.");
  if (exhibits.length === 0) openQuestionsForLawyer.push("Request supporting documents (contracts, letters, photos).");
  openQuestionsForLawyer.push("Run conflict-of-interest check before opening the file.");
  openQuestionsForLawyer.push("Confirm engagement-letter / opdrachtbevestiging is countersigned before substantive work.");

  return {
    cover,
    executiveSummary,
    parties,
    chronology,
    issues,
    caseTheory,
    exhibits,
    procedural,
    damages: { entries: damages.entries, totalEurMinor: damages.totalEurMinor, claimedTexts: damages.claimedTexts },
    risk,
    ovbAllocation,
    openQuestionsForLawyer,
    transcript: messages.map((m) => ({ role: m.role, text: m.content_redacted, ts: m.timestamp, via: m.via })),
    completeness,
  };
}

/**
 * Live preview shape used by the dossier sidebar while the visitor is still
 * chatting. Same builder, just strips the heavy fields.
 */
export function buildCaseFilePreview(args: {
  language: string;
  messages: IntakeMessage[];
  files: Array<Pick<IntakeFile, "original_filename" | "mime_type" | "storage_status">>;
}): CaseFilePreview {
  const full = buildCaseFile({ matterId: "draft-preview", language: args.language, messages: args.messages, files: args.files });
  return {
    cover: full.cover,
    executiveSummary: full.executiveSummary,
    parties: full.parties,
    chronology: full.chronology,
    issues: full.issues,
    caseTheory: full.caseTheory,
    exhibits: full.exhibits,
    procedural: full.procedural,
    damages: full.damages,
    risk: full.risk,
    openQuestionsForLawyer: full.openQuestionsForLawyer,
    completeness: full.completeness,
  };
}

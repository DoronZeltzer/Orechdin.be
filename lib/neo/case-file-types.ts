/**
 * Case File schema — what NEO assembles for a lawyer to pick up cold.
 *
 * Designed against the convergence of:
 *  - OVB (Orde van Vlaamse Balies) "Behandeling dossier" four-folder
 *    indeling: Intake / Communicatie / Processtukken / Overige stukken.
 *    https://www.ordevanvlaamsebalies.be/nl/leidraad-voor-een-kwalitatieve-praktijk/behandeling-dossier
 *  - ABA Litigation Section "Trial Notebook" sectioning.
 *  - NITA case-theory framework (legal / factual / persuasive theory + theme).
 *  - Modern AI-intake conventions (Harvey, Spellbook/CaseMark, Clio Grow):
 *    every fact carries a SourceRef pointer to its origin in the transcript
 *    or an attached document, so a partner can verify any line in seconds.
 *
 * Single source of truth for facts about Orechdin remains lib/site.ts and
 * data/neo-kb.json. This file defines the SHAPE of a generated case file,
 * never the firm's facts.
 */

import type { ConflictFlag } from "./conflict-flag";

// ---------------------------------------------------------------------------
// Atom: provenance pointer. Every leaf fact in the case file links back to
// the message (or document) it came from so the lawyer can verify it.
// ---------------------------------------------------------------------------

export type SourceRefKind = "user_message" | "assistant_message" | "document";

export interface SourceRef {
  kind: SourceRefKind;
  /** Sequence number of the message OR filename of the document. */
  ref: string;
  /** Optional verbatim quote (≤160 chars) so the partner can verify in-line. */
  quote?: string;
}

// ---------------------------------------------------------------------------
// Cover & executive summary
// ---------------------------------------------------------------------------

export type CaseFileStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ENGAGED"
  | "DECLINED"
  | "CLOSED";

export type UrgencyTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CaseFileCover {
  /** Internal matter id (the IntakeDraft id for now). */
  matterId: string;
  /** Caption shown at the top, e.g. "Tenant deposit dispute — Antwerp 2018". */
  caption: string;
  /**
   * One-sentence case theme — the moral / persuasive core a partner can
   * repeat in court. NITA convention. Synthesised from the user's words.
   */
  theme: string;
  practiceArea: string;
  status: CaseFileStatus;
  urgency: UrgencyTier;
  language: string;
  openedAt: string;
  /** Senior lawyer the firm should route the matter to, when obvious. */
  suggestedLead?: string;
  /** When the file should be returned to / followed up on, if extracted. */
  nextDeadline?: string;
  /** Top-level statute-of-limitations risk note, if detected. */
  statuteOfLimitationsAlert?: string;
}

export interface ExecutiveSummary {
  /** ≤300 words — partner reads this first. */
  paragraph: string;
  bullets: string[];
}

// ---------------------------------------------------------------------------
// Parties roster
// ---------------------------------------------------------------------------

export type PartyRole =
  | "client"
  | "opposing_party"
  | "opposing_counsel"
  | "third_party"
  | "witness"
  | "expert"
  | "court_or_authority"
  | "insurer"
  | "unknown";

export interface PartyEntry {
  id: string;
  role: PartyRole;
  /** Display name (may be a placeholder like "the landlord" if unnamed). */
  name: string;
  /** "individual" | "company" | "authority". Defaults to individual. */
  kind: "individual" | "company" | "authority" | "unknown";
  /** How the client describes the relationship, if any. */
  relationship?: string;
  /** Source pointer back to where the party first appeared. */
  source: SourceRef;
  /** Light conflict signal if the party's name overlaps with the firm's roster. */
  conflictNote?: string;
}

// ---------------------------------------------------------------------------
// Chronology (timeline) — the spine of a litigation file.
// ---------------------------------------------------------------------------

export interface ChronologyEntry {
  id: string;
  /**
   * ISO date or a free-text date phrase ("two weeks ago"). We keep both
   * because intake never has perfect dates; the lawyer normalises later.
   */
  dateText: string;
  /** Best-effort ISO date for sorting. May be null. */
  dateIso?: string;
  /** What happened, in the visitor's own words (lightly trimmed). */
  event: string;
  /** Source citation back to the user message / document. */
  source: SourceRef;
  /** Optional exhibit cross-references. */
  exhibitRefs?: string[];
  /** Issue ids this event supports. */
  issueRefs?: string[];
}

// ---------------------------------------------------------------------------
// Legal issues / case theory
// ---------------------------------------------------------------------------

export type IssueStrength = "WEAK" | "MIXED" | "PROMISING" | "STRONG" | "UNKNOWN";

export interface LegalIssue {
  id: string;
  /** Short title — e.g. "Was the dismissal procedure observed?". */
  question: string;
  /** Practice area this issue lives under. */
  area: string;
  /** What the visitor seems to want: damages / declaration / injunction / etc. */
  remedySought?: string;
  /** Strength is INTAKE-side guess only. The lawyer will replace this. */
  strength: IssueStrength;
  /** Open questions a lawyer should answer to firm up the issue. */
  openQuestions: string[];
}

export interface CaseTheory {
  /** Legal theory: which causes of action / legal hooks may apply. */
  legalTheory: string;
  /** Factual theory: the story of what happened, in 3–5 sentences. */
  factualTheory: string;
  /** Persuasive theory: why a court should care / what's morally at stake. */
  persuasiveTheory: string;
}

// ---------------------------------------------------------------------------
// Evidence / exhibit index
// ---------------------------------------------------------------------------

export type ExhibitClassification =
  | "contract"
  | "invoice"
  | "letter"
  | "summons"
  | "court_order"
  | "photo"
  | "id_document"
  | "bank_record"
  | "communication"
  | "policy_or_terms"
  | "report_or_expert"
  | "other";

export interface ExhibitEntry {
  /** "P-001", "P-002"… Plaintiff-style numbering by default at intake. */
  ref: string;
  filename: string;
  mimeType: string;
  classification: ExhibitClassification;
  oneLiner: string;
  /** Whether the file actually arrived in storage, etc. */
  uploadStatus: string;
  /** Source: who introduced it. */
  introducedBy: SourceRef;
  /** Optional cross-references to chronology or issues. */
  eventRefs?: string[];
  issueRefs?: string[];
}

// ---------------------------------------------------------------------------
// Procedural posture / deadlines
// ---------------------------------------------------------------------------

export type DeadlineKind =
  | "court_hearing"
  | "filing_deadline"
  | "response_deadline"
  | "statute_of_limitations"
  | "appointment"
  | "internal_review"
  | "other";

export interface ProceduralEntry {
  id: string;
  kind: DeadlineKind;
  dateText: string;
  dateIso?: string;
  description: string;
  /** Days from now (negative = passed, positive = future). */
  daysFromNow?: number;
  /** Whether this deadline triggers urgency escalation in the cover. */
  isHardStop: boolean;
  source: SourceRef;
}

// ---------------------------------------------------------------------------
// Damages / quantum
// ---------------------------------------------------------------------------

export type DamageCategory =
  | "economic_specials" // out-of-pocket: invoices, lost wages, property
  | "general" // pain, suffering, loss of enjoyment
  | "contractual" // contract value at stake
  | "penalties_or_interest"
  | "unknown";

export interface DamageEntry {
  id: string;
  category: DamageCategory;
  description: string;
  amountText: string; // verbatim ("€ 12.500", "around 5k")
  amountEurMinor?: number; // best-effort cents, never invented
  source: SourceRef;
}

export interface DamagesSummary {
  entries: DamageEntry[];
  /** Best-effort total in cents. Null when nothing extractable. */
  totalEurMinor: number | null;
  /** Verbatim list of claims so the lawyer can re-compute. */
  claimedTexts: string[];
}

// ---------------------------------------------------------------------------
// Risk & gating flags (top-level — never buried).
// ---------------------------------------------------------------------------

export interface RiskGate {
  conflictFlags: ConflictFlag[];
  /** Sensitive matter (asylum / sexual violence / minor / etc.) → special protocol. */
  sensitiveMatter: boolean;
  /** Possibly out-of-jurisdiction → may need referral. */
  jurisdictionRisk: boolean;
  /** Visitor mentioned existing counsel → check no double representation. */
  concurrentCounselMentioned: boolean;
  /**
   * Notes the lawyer must clear BEFORE opening. The cover surfaces these
   * as gating items; nothing below auto-blocks the intake.
   */
  preEngagementChecks: string[];
}

// ---------------------------------------------------------------------------
// Belgian dossier mapping (OVB four-folder taxonomy).
// We don't store actual folder contents; we declare which generated artefact
// belongs in which folder so the export Markdown is OVB-aligned.
// ---------------------------------------------------------------------------

export type OvbFolder =
  | "01_Intake"
  | "02_Communicatie"
  | "03_Processtukken"
  | "04_Overige_stukken";

export interface OvbAllocation {
  /** Friendly label of the artefact. */
  label: string;
  /** Folder the artefact belongs in per OVB Behandeling-dossier guidance. */
  folder: OvbFolder;
  /** Brief reason / rationale. */
  rationale: string;
}

// ---------------------------------------------------------------------------
// The full case file
// ---------------------------------------------------------------------------

export interface CaseFile {
  cover: CaseFileCover;
  executiveSummary: ExecutiveSummary;
  parties: PartyEntry[];
  chronology: ChronologyEntry[];
  issues: LegalIssue[];
  caseTheory: CaseTheory;
  exhibits: ExhibitEntry[];
  procedural: ProceduralEntry[];
  damages: DamagesSummary;
  risk: RiskGate;
  /** Map of generated artefacts → OVB folder. */
  ovbAllocation: OvbAllocation[];
  /** Lawyer-facing follow-up questions, surfaced separately from issue-level open questions. */
  openQuestionsForLawyer: string[];
  /** Append-only redacted transcript snapshot for the case file. */
  transcript: { role: "user" | "assistant"; text: string; ts: string; via?: "voice" | "keyboard" }[];
  /**
   * Completeness gauges reused in the dossier panel — same shape as the
   * legacy ReadinessProvenance so existing UI keeps working.
   */
  completeness: {
    hasIssue: boolean;
    hasTimeline: boolean;
    hasParties: boolean;
    hasLocation: boolean;
    hasStakes: boolean;
    fileCount: number;
    /** 0–100 overall completeness score. */
    score: number;
  };
}

/**
 * Lightweight live preview shape (no transcript / OVB allocation). Used in
 * the Case Room dossier sidebar where we re-build on every keystroke.
 */
export type CaseFilePreview = Pick<
  CaseFile,
  | "cover"
  | "executiveSummary"
  | "parties"
  | "chronology"
  | "issues"
  | "caseTheory"
  | "exhibits"
  | "procedural"
  | "damages"
  | "risk"
  | "openQuestionsForLawyer"
  | "completeness"
>;

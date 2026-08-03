import { IntakeDraft, IntakeMessage, IntakeFile } from "./intake-types";
import { detectConflictFlags, type ConflictFlag } from "./conflict-flag";
import { compileIntakeReportPrompt } from "./intake-report-prompt";
import { callFreeAIFallbackLoop } from "./freeai-bridge";
import { 
  NormalizedValidationResult, 
  ReportStatus, 
  PreviewMode,
  StrictIntakeReportValidated
} from "./intake-report-schema";
import { validateDossierModelOutput } from "./intake-report-validator";
import { runDossierSafetyChecks } from "./dossier-safety-checks";

/**
 * Practice areas the firm publishes in lib/site.ts and data/neo-kb.json.
 */
export const PUBLISHED_PRACTICE_AREAS = [
  "Commercial",
  "Civil",
  "Criminal",
  "Family",
  "Employment",
  "Real estate / Construction",
  "Traffic",
  "Residence & civil liability",
  "Rental disputes",
  "Debt collection",
  "General",
] as const;

export type PracticeAreaSuggestion = (typeof PUBLISHED_PRACTICE_AREAS)[number];

export interface ReadinessProvenance {
  hasIssue: boolean;
  hasTimeline: boolean;
  hasParties: boolean;
  hasLocation: boolean;
  hasStakes: boolean;
  fileCount: number;
}

export interface CaseDossier extends NormalizedValidationResult {
  header: {
    reference_id: string;
    submitted_at: string;
    channel: string;
    verification_status: string;
  };
  client: {
    verified_email: string;
    phone?: string;
    language: string;
    name?: string;
  };
  documents: {
    filename: string;
    mime_type: string;
    upload_status: string;
    one_liner: string;
  }[];
  /** Structured conflict / sensitivity signals attached to the dossier header. */
  conflict_flags: ConflictFlag[];
  /** Append-only redacted transcript for the case file. */
  transcript: { role: "user" | "assistant"; text: string; ts: string }[];
  /** Which signals contributed to the readiness score, for the lawyer to gauge completeness. */
  readiness_provenance: ReadinessProvenance;
  confirmation_copy: string;
}

// ---------------------------------------------------------------------------
// Heuristic extractors for missing data provenance (only real-time tracking)
// ---------------------------------------------------------------------------

const TIMELINE_PATTERNS = [
  /\b\d{1,2}[\/\-.]\d{1,2}([\/\-.]\d{2,4})?\b/g,
  /\b(\d+\s+(years?|months?|weeks?|days?|hours?|jaren?|maanden?|weken?|dagen?|uren?|ans?|mois|semaines?|jours?|heures?))\s+(ago|geleden|il y a)?/gi,
  /\b(yesterday|today|tomorrow|last\s+(week|month|year)|gisteren|vandaag|morgen|hier|aujourd'hui|demain)\b/gi,
];

const PARTY_PATTERNS = [
  /\b(my\s+(employer|landlord|tenant|spouse|partner|wife|husband|ex|neighbour|neighbor|colleague|boss|client))\b/gi,
  /\b(the\s+(company|bank|insurance|insurer|tenant|landlord|police|judge|court|prosecutor|opposing\s+party|other\s+driver))\b/gi,
  /\b(mijn\s+(werkgever|huurder|verhuurder|partner|echtgen(?:oot|ote)|buur|collega|baas|client))\b/gi,
  /\b(mon|ma)\s+(employeur|locataire|propriétaire|conjoint|conjointe|partenaire|voisin|collègue|patron|client)\b/gi,
  /\b([A-Z][a-zàâçéèêëîïôûùüÿñ]+(?:\s+[A-Z][a-zàâçéèêëîïôûùüÿñ]+){0,2})\s+(NV|BV|SA|SARL|GmbH|Ltd|Inc)\b/g,
];

const LOCATION_PATTERNS =
  /\b(antwerp|antwerpen|anvers|brussels|bruxelles|brussel|ghent|gent|gand|leuven|liège|liege|namur|namen|charleroi|mechelen|hasselt|bruges|brugge|belgium|belgië|belgique|flanders|vlaanderen|wallonia|wallonie|court of appeal|hof van beroep|cour d'appel|police court|politierechtbank|tribunal de police)\b/gi;

const MONEY_PATTERNS =
  /(€\s*\d[\d.,]*|\d[\d.,]*\s*(?:euro|eur|usd|dollars?))/gi;

function uniqStrings(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))).slice(0, 12);
}

function extractTimeline(text: string): string[] {
  const out: string[] = [];
  for (const rx of TIMELINE_PATTERNS) {
    const matches = text.match(rx);
    if (matches) out.push(...matches);
  }
  return uniqStrings(out);
}

function extractParties(text: string): string[] {
  const out: string[] = [];
  for (const rx of PARTY_PATTERNS) {
    const matches = text.match(rx);
    if (matches) out.push(...matches);
  }
  return uniqStrings(out);
}

function extractLocations(text: string): string[] {
  const matches = text.match(LOCATION_PATTERNS);
  return matches ? uniqStrings(matches) : [];
}

function extractMoney(text: string): string[] {
  const matches = text.match(MONEY_PATTERNS);
  return matches ? uniqStrings(matches) : [];
}

function fileOneLiner(name: string, mime: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("contract") || lower.includes("contrat") || lower.includes("overeenkomst")) return "Contract or agreement";
  if (lower.includes("invoice") || lower.includes("facture") || lower.includes("factuur")) return "Invoice";
  if (lower.includes("letter") || lower.includes("brief") || lower.includes("lettre")) return "Letter / correspondence";
  if (lower.includes("summons") || lower.includes("dagvaard") || lower.includes("citation")) return "Summons / formal notice";
  if (lower.includes("photo") || mime.startsWith("image/")) return "Photo / image";
  if (mime.startsWith("application/pdf") || lower.endsWith(".pdf")) return "PDF document";
  return "Supporting document";
}

export async function generateIntakeSummary(
  draft: IntakeDraft,
  messages: IntakeMessage[],
  files: IntakeFile[],
  clientData: { email: string; phone?: string; name?: string },
): Promise<CaseDossier> {
  const allText = messages.map((m) => m.content_redacted).join("\n");
  const userText = messages.filter((m) => m.role === "user").map((m) => m.content_redacted).join("\n");
  const fileData = files.map((f) => `- ${f.original_filename} (${f.mime_type})`).join("\n");
  
  const prompt = compileIntakeReportPrompt(allText, fileData);
  const aiResult = await callFreeAIFallbackLoop(prompt, "neo_intake_compiler");

  let validationResult: NormalizedValidationResult;
  
  if (!aiResult.ok || !aiResult.text) {
    validationResult = {
      report_status: "invalid_extraction",
      hard_block_status: true,
      dispatch_allowed: false,
      preview_mode: "none",
      blocked_message: "Network exception or API failure inside generation loop.",
      validation_errors: ["API failed to return text."],
      safety_reasons: [],
      dossier: null,
    };
  } else {
    validationResult = validateDossierModelOutput(aiResult.text, allText, "strict_partner_facing");
  }

  const provenance: ReadinessProvenance = {
    hasIssue: messages.some((m) => m.role === "user"),
    hasTimeline: extractTimeline(userText).length > 0,
    hasParties: extractParties(userText).length > 0,
    hasLocation: extractLocations(userText).length > 0,
    hasStakes: extractMoney(userText).length > 0,
    fileCount: files.length,
  };

  return {
    ...validationResult,
    header: {
      reference_id: draft.id,
      submitted_at: new Date().toISOString(),
      channel: "Neo AI Web Intake",
      verification_status: "VERIFIED_EMAIL",
    },
    client: {
      verified_email: clientData.email,
      phone: clientData.phone,
      name: clientData.name,
      language: draft.language || "English",
    },
    documents: files.map((f) => ({
      filename: f.original_filename,
      mime_type: f.mime_type,
      upload_status: f.storage_status,
      one_liner: fileOneLiner(f.original_filename, f.mime_type),
    })),
    conflict_flags: detectConflictFlags({
      transcriptText: allText,
      documentNames: files.map((f) => f.original_filename),
    }),
    transcript: messages.map((m) => ({ role: m.role, text: m.content_redacted, ts: m.timestamp })),
    readiness_provenance: provenance,
    confirmation_copy: "Your intake summary and supporting information have been securely submitted for legal review."
  };
}

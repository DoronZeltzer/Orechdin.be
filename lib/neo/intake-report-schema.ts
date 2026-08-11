import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// A. Matter Snapshot - expanded with procedural posture fields
// ─────────────────────────────────────────────────────────────
export const MatterSnapshotSchema = z.object({
  visitor_issue: z.string(),
  requested_help: z.string(),
  practice_area: z.string(),
  classification_confidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNCONFIRMED"]),
  jurisdiction_status: z.string(),
  report_readiness_status: z.enum(["PARTNER_REVIEW_READY", "INTAKE_ONLY", "BLOCKED"]),
  executive_narrative: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// K. Liability Exposure Assessment
// ─────────────────────────────────────────────────────────────
export const LiabilityExposureSchema = z.object({
  initial_assessment: z.string(),
  contributing_factors: z.array(z.string()),
  risk_level: z.enum(["CRITICAL", "HIGH", "MODERATE", "LOW", "INDETERMINATE"]),
  mitigating_factors: z.array(z.string()).optional(),
  aggravating_factors: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────
// L. Strategic Litigation Alternatives
// ─────────────────────────────────────────────────────────────
export const StrategicAlternativeSchema = z.object({
  mechanism: z.string(),
  suitability: z.enum(["RECOMMENDED", "VIABLE", "CONDITIONAL", "NOT_RECOMMENDED"]),
  rationale: z.string(),
});

// ─────────────────────────────────────────────────────────────
// M. Procedural Posture Analysis
// ─────────────────────────────────────────────────────────────
export const ProceduralPostureSchema = z.object({
  current_stage: z.string(),
  next_procedural_steps: z.array(z.string()),
  limitation_flags: z.array(z.string()).optional(),
  urgency_classification: z.enum(["IMMEDIATE", "TIME_SENSITIVE", "STANDARD", "NO_URGENCY"]).optional(),
});

// ─────────────────────────────────────────────────────────────
// N. Parties & Witness Map
// ─────────────────────────────────────────────────────────────
export const PartyWitnessSchema = z.object({
  designation: z.string(),
  role: z.enum(["CLAIMANT", "RESPONDENT", "WITNESS", "THIRD_PARTY", "AUTHORITY", "UNKNOWN"]),
  relationship: z.string(),
  relevance: z.string(),
});

// ─────────────────────────────────────────────────────────────
// O. Quantum & Damages Model
// ─────────────────────────────────────────────────────────────
export const QuantumDamagesSchema = z.object({
  principal_sum: z.string(),
  statutory_interests: z.string(),
  consequential_costs: z.string(),
  moral_damages: z.string(),
  total_estimated_exposure: z.string(),
  quantification_confidence: z.enum(["DOCUMENTED", "ESTIMATED", "SPECULATIVE", "UNQUANTIFIABLE"]),
});

// ─────────────────────────────────────────────────────────────
// Master Schema - backward-compatible (new sections optional)
// ─────────────────────────────────────────────────────────────
export const StrictIntakeReportSchema = z.object({
  // Core sections (A–J) - existing contract
  A_matter_snapshot: MatterSnapshotSchema,
  B_confirmed_facts: z.array(z.string()),
  C_likely_unconfirmed_points: z.array(z.string()),
  D_missing_critical_facts: z.array(z.string()),
  E_timeline_extracted: z.array(z.string()),
  F_working_issue_map: z.array(z.string()),
  G_evidence_currently_available: z.array(z.string()),
  H_evidence_to_request_next: z.array(z.string()),
  I_high_value_open_questions: z.array(z.string()),
  J_delivery_status: z.enum(["validated", "blocked", "intake-only", "partner-review-ready"]),
  hard_block_status: z.boolean().nullable().optional(),

  // Professional sections (K–O) - new intelligence layers
  K_liability_exposure: LiabilityExposureSchema.optional(),
  L_strategic_alternatives: z.array(StrategicAlternativeSchema).optional(),
  M_procedural_posture: ProceduralPostureSchema.optional(),
  N_parties_witness_map: z.array(PartyWitnessSchema).optional(),
  O_quantum_damages: QuantumDamagesSchema.optional(),
});

export type StrictIntakeReportValidated = z.infer<typeof StrictIntakeReportSchema>;

export type ReportStatus = "validated" | "blocked" | "invalid_extraction" | "intake_only" | "partner_review_ready";
export type PreviewMode = "validated_structured" | "blocked_state" | "none";

// The canonical normalized result required by the unified flow
export interface NormalizedValidationResult {
  report_status: ReportStatus;
  hard_block_status: boolean;
  dispatch_allowed: boolean;
  preview_mode: PreviewMode;
  blocked_message?: string;
  validation_errors: string[];
  safety_reasons: string[];
  dossier: StrictIntakeReportValidated | null;
}

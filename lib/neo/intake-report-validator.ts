import { NormalizedValidationResult, StrictIntakeReportSchema } from "./intake-report-schema";
import { runDossierSafetyChecks } from "./dossier-safety-checks";

export function validateDossierModelOutput(
  rawModelOutput: string,
  transcriptText: string,
  mode: "strict_partner_facing" | "internal_debug"
): NormalizedValidationResult {

  if (mode !== "strict_partner_facing" && mode !== "internal_debug") {
    throw new Error("Invalid validation mode");
  }

  const result: NormalizedValidationResult = {
    report_status: "invalid_extraction",
    hard_block_status: true,
    dispatch_allowed: false,
    preview_mode: "none",
    blocked_message: "Structured dossier extraction failed. Dispatch is unavailable.",
    validation_errors: [],
    safety_reasons: [],
    dossier: null,
  };

  // 1. Exact JSON Contract Gate
  const trimmed = rawModelOutput.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    result.report_status = "invalid_extraction";
    result.preview_mode = "none";
    result.validation_errors.push("Exact JSON contract failed: Output contained markdown, prose, or wrappers.");
    return result;
  }

  // 2. JSON.parse
  let rawJson: any;
  try {
    rawJson = JSON.parse(trimmed);
  } catch (e: any) {
    result.report_status = "invalid_extraction";
    result.preview_mode = "none";
    result.validation_errors.push("Invalid JSON strictly parsed: " + e.message);
    return result;
  }

  // 3. Zod schema validation
  const parsed = StrictIntakeReportSchema.safeParse(rawJson);
  if (!parsed.success) {
    result.report_status = "blocked";
    result.preview_mode = "blocked_state";
    result.blocked_message = "Report blocked due to structural schema violation. Cannot guarantee professional output delivery.";
    result.validation_errors = parsed.error.issues.map(err => `${err.path.join(".")}: ${err.message}`);
    return result;
  }

  const dossier = parsed.data;
  result.dossier = dossier;

  // 4. Check for explicit AI-supplied hardblock (from the prompt itself)
  if (dossier.hard_block_status === true) {
    result.report_status = "blocked";
    result.preview_mode = "blocked_state";
    result.blocked_message = "Model explicitly flagged extraction as unsafe or cross-domain. Blocked for manual triage.";
    result.safety_reasons.push("AI explicitly flagged hard block.");
    return result;
  }

  // 5. Run rigorous post-validation safety checks
  const safety = runDossierSafetyChecks(dossier, transcriptText);
  if (!safety.passed) {
    if (safety.hard_block_status === true) {
      result.report_status = "blocked";
      result.hard_block_status = true;
      result.dispatch_allowed = false;
      result.preview_mode = "blocked_state";
      result.blocked_message = "Report blocked due to critical safety or quality violation.";
      result.safety_reasons.push(...safety.reasons);
      return result;
    } else if (safety.downgrade_to_intake_only) {
      // Downgrade to intake_only. It passes, but is visibly incomplete for a partner review.
      result.report_status = "intake_only";
      result.hard_block_status = false;
      result.dispatch_allowed = true; // Still dispatchable to intake queue, but not partner review.
      result.preview_mode = "validated_structured";
      result.blocked_message = undefined;
      result.safety_reasons.push(...safety.reasons);
      // Overwrite the dossier's own readiness status so UI/backend knows
      dossier.J_delivery_status = "intake-only";
      dossier.A_matter_snapshot.report_readiness_status = "INTAKE_ONLY";
      return result;
    }
  }

  // 6. Final success alignment
  // Ensure we match the internal model's decision with backend tracking
  if (dossier.A_matter_snapshot.report_readiness_status === "INTAKE_ONLY" || dossier.A_matter_snapshot.report_readiness_status === "BLOCKED") {
      result.report_status = dossier.A_matter_snapshot.report_readiness_status === "BLOCKED" ? "blocked" : "intake_only";
  } else {
      result.report_status = "partner_review_ready";
  }
  
  result.hard_block_status = false;
  result.dispatch_allowed = true;
  result.preview_mode = "validated_structured";
  result.blocked_message = undefined;

  return result;
}

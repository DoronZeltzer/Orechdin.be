import { IntakeRouting, IntakeSubmission } from "./intake-types";
import { CaseDossier } from "./intake-summary";

export type RouteOutcome = 
  | "ROUTED_AUTO"
  | "ROUTED_WITH_LOW_CONFIDENCE"
  | "ROUTED_MANUAL_REVIEW"
  | "ROUTED_CONFLICT_CHECK_PENDING"
  | "ROUTED_REJECT_UNSUPPORTED"
  | "ROUTED_REQUIRES_MORE_INFO";

export function determineRouting(submission: IntakeSubmission, dossier: CaseDossier): { outcome: RouteOutcome; target: string; confidence: "HIGH" | "MEDIUM" | "LOW" } {
  // Hard policy rejections based on conflict flags
  const hasUnsupportedJurisdiction = dossier.conflict_flags.some(f => f.id === "out-of-jurisdiction");
  if (hasUnsupportedJurisdiction) {
    return { outcome: "ROUTED_REJECT_UNSUPPORTED", target: "rejections", confidence: "HIGH" };
  }
  
  const hasConfidentialSensitivity = dossier.conflict_flags.some(f => f.id === "sensitive-domain");
  if (hasConfidentialSensitivity) {
    return { outcome: "ROUTED_CONFLICT_CHECK_PENDING", target: "conflict_check", confidence: "HIGH" };
  }

  // Triage urgency
  const urgencyEstimate = dossier.dossier?.A_matter_snapshot.visitor_issue || "";
  if (urgencyEstimate.toLowerCase().includes("urgent") || urgencyEstimate.toLowerCase().includes("emergency")) {
    return { outcome: "ROUTED_MANUAL_REVIEW", target: "priority_triage", confidence: "HIGH" };
  }

  // Default Practice Area mapping
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  const mappedQueue = (dossier.dossier?.A_matter_snapshot.practice_area || "").toLowerCase().includes("family") 
    ? "family_law" 
    : "general_intake";

  if (dossier.dossier?.I_high_value_open_questions && dossier.dossier.I_high_value_open_questions.length > 2) {
     return { outcome: "ROUTED_REQUIRES_MORE_INFO", target: "general_intake", confidence: "LOW" };
  }

  return { outcome: "ROUTED_AUTO", target: mappedQueue, confidence };
}

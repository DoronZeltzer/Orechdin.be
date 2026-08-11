import { StrictIntakeReportValidated } from "./intake-report-schema";

export interface SafetyCheckResult {
  passed: boolean;
  hard_block_status: boolean;
  reasons: string[];
  flags: string[];
  downgrade_to_intake_only?: boolean;
}

export function runDossierSafetyChecks(
  dossier: StrictIntakeReportValidated,
  transcriptText: string
): SafetyCheckResult {
  const flags: string[] = [];
  const reasons: string[] = [];
  let passed = true;
  let hard_block_status = false;
  let downgrade_to_intake_only = false;

  const fullTextLowerCase = JSON.stringify(dossier).toLowerCase();
  const transcriptLower = transcriptText.toLowerCase();

  // ─── GATE 1: Office-marketing contamination ───────────────
  const marketingPhrases = ["contact our office", "call us now", "our philosophy", "visit our website", "contact page", "call us", "book an appointment"];
  for (const phrase of marketingPhrases) {
    if (fullTextLowerCase.includes(phrase)) {
      passed = false;
      hard_block_status = true;
      reasons.push(`Office-marketing contamination detected: '${phrase}'`);
      flags.push("MARKETING_CONTAMINATION");
    }
  }

  // ─── GATE 2: Chronology emptiness ─────────────────────────
  const hasTimelineMarkers = /\b(ago|last|yesterday|week|month|year|\d{1,2}[\/\-\.]\d{1,2})\b/i.test(transcriptLower);
  if (hasTimelineMarkers && dossier.E_timeline_extracted.length === 0) {
    passed = false;
    downgrade_to_intake_only = true;
    reasons.push("Chronology emptiness despite obvious event sequence in transcript. Downgrading to intake-only.");
    flags.push("EMPTY_CHRONOLOGY");
  }

  // ─── GATE 3: Cross-domain leakage ────────────────────────
  const pa = dossier.A_matter_snapshot.practice_area.toLowerCase();
  if (pa.includes("traffic") || pa.includes("parking")) {
    if (fullTextLowerCase.includes("custody") || fullTextLowerCase.includes("divorce") || fullTextLowerCase.includes("severance")) {
      passed = false;
      hard_block_status = true;
      reasons.push("Cross-domain leakage detected (Family/Employment concepts in Traffic matter)");
      flags.push("CROSS_DOMAIN_LEAKAGE");
    }
  }

  // ─── GATE 4: Practice area mismatch ───────────────────────
  if (pa.includes("criminal") && transcriptLower.includes("permit") && transcriptLower.includes("construction") && !transcriptLower.includes("police")) {
    passed = false;
    hard_block_status = true;
    reasons.push("Practice area mismatch against transcript signals.");
    flags.push("PRACTICE_AREA_MISMATCH");
  }

  // ─── GATE 5: Excessive document requests ──────────────────
  if (dossier.H_evidence_to_request_next.length > 10) {
    passed = false;
    hard_block_status = true;
    reasons.push("Excessive or unfocused evidence requests detected.");
    flags.push("EXCESSIVE_DOCUMENT_REQUESTS");
  }

  // ─── GATE 6: Generic filler detection ────────────────────
  const genericQuestions = ["can you provide more details?", "what else happened?", "is there any other information?"];
  for (const q of genericQuestions) {
    if (fullTextLowerCase.includes(q)) {
      passed = false;
      downgrade_to_intake_only = true;
      reasons.push(`Generic filler open-question detected: '${q}'. Downgrading to intake-only.`);
      flags.push("GENERIC_FILLER_QUESTIONS");
    }
  }

  // ─── GATE 7: Confidence & readiness calibration ───────────
  if (dossier.A_matter_snapshot.classification_confidence === "LOW" || dossier.A_matter_snapshot.classification_confidence === "UNCONFIRMED") {
    if (dossier.A_matter_snapshot.report_readiness_status === "PARTNER_REVIEW_READY") {
      passed = false;
      downgrade_to_intake_only = true;
      reasons.push("Inflated certainty: low classification confidence cannot yield a partner-ready report.");
      flags.push("INFLATED_CERTAINTY");
    }
  }

  // ─── GATE 8: Liability exposure coherence (NEW) ───────────
  if (dossier.K_liability_exposure) {
    const le = dossier.K_liability_exposure;
    // Risk level CRITICAL/HIGH with zero contributing factors = hallucinated severity
    if ((le.risk_level === "CRITICAL" || le.risk_level === "HIGH") && le.contributing_factors.length === 0) {
      passed = false;
      downgrade_to_intake_only = true;
      reasons.push("Liability exposure claims CRITICAL/HIGH risk but provides zero contributing factors. Analytically incoherent.");
      flags.push("LIABILITY_INCOHERENCE");
    }
    // Empty assessment text with non-INDETERMINATE risk
    if (le.initial_assessment.trim().length < 10 && le.risk_level !== "INDETERMINATE") {
      flags.push("SHALLOW_LIABILITY_ASSESSMENT");
      reasons.push("Liability assessment text is suspiciously thin for the stated risk level.");
    }
  }

  // ─── GATE 9: Strategic alternatives quality (NEW) ─────────
  if (dossier.L_strategic_alternatives && dossier.L_strategic_alternatives.length > 0) {
    for (const alt of dossier.L_strategic_alternatives) {
      if (alt.rationale.trim().length < 15) {
        flags.push("WEAK_STRATEGIC_RATIONALE");
        reasons.push(`Strategic alternative '${alt.mechanism}' has insufficient rationale.`);
      }
    }
    // All mechanisms marked RECOMMENDED is suspicious
    const allRecommended = dossier.L_strategic_alternatives.every(a => a.suitability === "RECOMMENDED");
    if (allRecommended && dossier.L_strategic_alternatives.length > 2) {
      downgrade_to_intake_only = true;
      passed = false;
      reasons.push("All strategic alternatives marked RECOMMENDED. Analytical differentiation missing.");
      flags.push("UNDIFFERENTIATED_STRATEGY");
    }
  }

  // ─── GATE 10: Party/witness map coherence (NEW) ───────────
  if (dossier.N_parties_witness_map && dossier.N_parties_witness_map.length > 0) {
    const hasClaimant = dossier.N_parties_witness_map.some(p => p.role === "CLAIMANT");
    if (!hasClaimant) {
      flags.push("NO_CLAIMANT_IDENTIFIED");
      reasons.push("Party map exists but no CLAIMANT role identified.");
    }
  }

  // ─── GATE 11: Quantum hallucination check (NEW) ──────────
  if (dossier.O_quantum_damages) {
    const qd = dossier.O_quantum_damages;
    // If confidence is DOCUMENTED but transcript contains no numbers
    const hasNumbers = /\d+/.test(transcriptLower);
    if (qd.quantification_confidence === "DOCUMENTED" && !hasNumbers) {
      passed = false;
      downgrade_to_intake_only = true;
      reasons.push("Quantum damages marked DOCUMENTED but transcript contains no numerical figures. Possible hallucination.");
      flags.push("QUANTUM_HALLUCINATION");
    }
  }

  // ─── GATE 12: Executive narrative quality (NEW) ───────────
  if (dossier.A_matter_snapshot.executive_narrative) {
    const en = dossier.A_matter_snapshot.executive_narrative;
    if (en.length < 50) {
      flags.push("THIN_EXECUTIVE_NARRATIVE");
      reasons.push("Executive narrative is under 50 characters - insufficient for partner review.");
    }
    // Check for marketing contamination in executive narrative specifically
    const enLower = en.toLowerCase();
    if (enLower.includes("our firm") || enLower.includes("we specialize") || enLower.includes("our team")) {
      passed = false;
      hard_block_status = true;
      reasons.push("Executive narrative contains firm-promotional language. Hard block.");
      flags.push("NARRATIVE_MARKETING_CONTAMINATION");
    }
  }

  // ─── Final evaluation logic ───────────────────────────────
  if (downgrade_to_intake_only && !hard_block_status) {
    passed = false;
  }

  return { passed, hard_block_status, downgrade_to_intake_only, reasons, flags };
}

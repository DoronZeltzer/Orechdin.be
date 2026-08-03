import { SessionState, mergeSessionState } from "./session-state";
import { ReviewResult, callSwarmReviewer } from "./swarm-reviewer";
import type { KbEntry } from "./types";
import { logHighRiskClaimDetected, logOutputBlocked } from "./telemetry";

export interface EnforcementResult {
  ok: boolean;
  text: string;
  error?: string;
  sentencesRewritten: number;
  unsupportedClaimRate: number;
  updatedState: SessionState;
}

export function detectHighRiskClaims(text: string): boolean {
  const highRiskRegex = /\b(\d+\s*(days|dagen|jours|weken|weeks|months|maanden))\b|\b(article|artikel|statute|law|wet|decreet)\s+\d+\b|\b(appeal|beroep|cour|rechtbank|court)\b/i;
  return highRiskRegex.test(text);
}

export async function enforceOutputSafety(
  draftText: string,
  kbHits: KbEntry[],
  sessionState: SessionState,
  routedPersona: string,
  taskClass: string,
  language: string
): Promise<EnforcementResult> {
  const isHighRiskRegex = detectHighRiskClaims(draftText);
  if (isHighRiskRegex) {
    logHighRiskClaimDetected({ textSubset: draftText.substring(0, 50), trigger: "regex" });
  }

  // 1. Differentiate Strictness
  // If persona is legal-guide or task is high_risk_shaping, we use strict mode
  const isProcedure = routedPersona === "legal-guide" || taskClass === "high_risk_shaping";
  
  // 2. Call Reviewer
  const review = await callSwarmReviewer(draftText, kbHits, isProcedure);
  
  let finalState = sessionState;
  
  if (!review) {
    // Reviewer Parse Error or Timeout -> Fail Closed if procedural
    if (isHighRiskRegex && kbHits.length === 0) {
      logOutputBlocked({ reason: "ungrounded_high_risk_claim_regex_fallback" });
      return {
        ok: false,
        text: "",
        error: "Triggered High-Risk Claim Gate without KB grounding (Fail-Closed Phase 1).",
        sentencesRewritten: 0,
        unsupportedClaimRate: 1,
        updatedState: finalState
      };
    }
    
    // For non-procedural, or if grounded, we fail open (but attach disclaimer if needed)
    let modifiedText = draftText;
    if (isProcedure && finalState.jurisdiction_status !== "confirmed") {
        const disclaimer = language === "nl" 
        ? "\n\n*Let op: deze oriëntatie is uitsluitend gebaseerd op Belgische/Vlaamse praktijken. Buiten deze jurisdictie kunnen de regels sterk afwijken.*"
        : language === "fr"
        ? "\n\n*Attention : cette orientation est exclusivement basée sur les pratiques belges/flamandes. En dehors de cette juridiction, les règles varient.*"
        : "\n\n*Please note: this orientation is exclusively based on Belgian/Flemish practices. If your matter is outside this jurisdiction, exact rules vary.*";
      modifiedText += disclaimer;
    }

    return {
      ok: true,
      text: modifiedText,
      sentencesRewritten: 0,
      unsupportedClaimRate: 0,
      updatedState: finalState
    };
  }

  // 3. Process Review Result (No fragile string replacement)
  let outputText = review.full_rewritten_draft || draftText;
  
  let unsupportedCount = 0;
  for (const claim of review.high_risk_claims) {
    if (!claim.supported_by_source) unsupportedCount++;
  }
  
  const claimRate = review.high_risk_claims.length > 0 ? (unsupportedCount / review.high_risk_claims.length) : 0;
  const wasRewritten = !!review.full_rewritten_draft;

  if (unsupportedCount > 0 && wasRewritten) {
    logHighRiskClaimDetected({ trigger: "reviewer", unsupportedCount, sentencesRewritten: 1 });
  }

  // 3b. Mitigate Orientation Fail-Open leak
  // Even if not procedural, if there were unsupported claims and we rewriting didn't trigger strict mode, 
  // or if we did rewrite, we still want to ensure orientation boundaries are marked clearly.
  if (!isProcedure && unsupportedCount > 0 && finalState.jurisdiction_status !== "confirmed") {
    const disclaimer = language === "nl" 
    ? "\n\n*Let op: deze oriëntatie is gebaseerd op algemene praktijken en kan afwijken van uw specifieke situatie.*"
    : language === "fr"
    ? "\n\n*Attention : cette orientation est basée sur des pratiques générales et peut différer de votre situation spécifique.*"
    : "\n\n*Please note: this orientation is based on general practices and may differ from your specific situation.*";
    if (!outputText.includes(disclaimer)) {
      outputText += disclaimer;
    }
  }

  // 4. State Update: Jurisdiction
  finalState = mergeSessionState(finalState, {
    jurisdiction_status: review.jurisdiction_status
  });

  // 5. State-Aware Ambiguity Handling
  // Only ask if jurisdiction is unclear AND we haven't asked recently (missing_critical_facts doesn't already contain jurisdiction)
  if (
    review.jurisdiction_status === "unclear" &&
    isProcedure && 
    !finalState.missing_critical_facts.includes("jurisdiction")
  ) {
    const inquiry = language === "nl" 
      ? "\n\nOm u correct juridisch richting te kunnen geven, kunt u bevestigen of deze situatie zich in België (Vlaanderen/Brussel) afspeelt?"
      : language === "fr"
      ? "\n\nPour pouvoir vous orienter correctement, pouvez-vous confirmer si cette situation se déroule en Belgique (Flandre/Bruxelles) ?"
      : "\n\nTo ensure our guidance is accurate, could you confirm if this situation is taking place within Belgium (Flanders/Brussels)?";
    outputText += inquiry;
    
    // Add it so we don't ask next turn
    finalState = mergeSessionState(finalState, {
      missing_critical_facts: [...finalState.missing_critical_facts, "jurisdiction"]
    });
  }

  return {
    ok: true,
    text: outputText,
    sentencesRewritten: wasRewritten ? 1 : 0, // Since it replaces the whole draft, we count it as a full rewrite
    unsupportedClaimRate: claimRate,
    updatedState: finalState
  };
}

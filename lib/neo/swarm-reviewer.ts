import { callFreeAIFallbackLoop } from "./freeai-bridge";
import type { KbEntry } from "./types";

export interface HighRiskClaim {
  sentence: string;
  category: "procedural_advice" | "deadline_statement" | "statutory_reference" | "authority_naming" | "jurisdiction_specific_remedy" | "orientation";
  supported_by_source: boolean;
  kb_source_id: string | null;
}

export interface ReviewResult {
  jurisdiction_status: "confirmed" | "inferred" | "unclear";
  high_risk_claims: HighRiskClaim[];
  full_rewritten_draft: string | null;
}

export async function callSwarmReviewer(
  draftText: string, 
  kbHits: KbEntry[], 
  strictMode: boolean = false
): Promise<ReviewResult | null> {
  const sourcesText = kbHits.map(hit => `[ID: ${hit.id}] ${hit.title}\n${hit.body}`).join("\n\n");
  
  const prompt = `
You are an adversarial Legal Safety Reviewer. Your job is to review a draft response for a legal orientation system and verify explicitly that every technical claim is supported.

<DRAFT_TEXT>
${draftText}
</DRAFT_TEXT>

<VERIFIED_SOURCES>
${sourcesText}
</VERIFIED_SOURCES>

Task:
1. Determine the "jurisdiction_status" ("confirmed", "inferred", or "unclear").
2. Extract all "high_risk_claims" from the draft (deadlines, procedures, statutes, authorities).
3. For each claim, set "supported_by_source" to true ONLY IF it is explicitly stated in VERIFIED_SOURCES.
4. If ANY claim has "supported_by_source" = false, or if strictMode is enabled (${strictMode}), provide a "full_rewritten_draft" which is the entire draft rewritten safely, neutralizing unsupported claims. If all claims are supported, you may set "full_rewritten_draft" to null.

You MUST return your analysis as ONLY a valid JSON object matching this schema. Do not output anything other than JSON:
{
  "jurisdiction_status": "confirmed" | "inferred" | "unclear",
  "high_risk_claims": [
    {
      "sentence": "Exact text from draft",
      "category": "procedural_advice" | "deadline_statement" | "statutory_reference" | "authority_naming" | "jurisdiction_specific_remedy" | "orientation",
      "supported_by_source": boolean,
      "kb_source_id": "ID of the source, or null"
    }
  ],
  "full_rewritten_draft": "The complete modified draft, or null"
}
`;

  let retries = 2;
  while (retries >= 0) {
    try {
      const res = await callFreeAIFallbackLoop(prompt, "legal_reviewer");
      if (!res.ok || !res.text) throw new Error("Empty response from AI");
      
      let cleaned = res.text.trim();
      if (cleaned.startsWith("\`\`\`json")) cleaned = cleaned.substring(7);
      if (cleaned.startsWith("\`\`\`")) cleaned = cleaned.substring(3);
      if (cleaned.endsWith("\`\`\`")) cleaned = cleaned.substring(0, cleaned.length - 3);
      
      return JSON.parse(cleaned.trim()) as ReviewResult;
    } catch (e) {
      console.warn(`Swarm Reviewer JSON Parse Error. Retries remaining: ${retries}`, e);
      retries--;
    }
  }

  // Failed entirely, fail-closed mechanism returns null
  return null;
}

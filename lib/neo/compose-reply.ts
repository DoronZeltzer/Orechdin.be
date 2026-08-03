/**
 * NEO reply orchestrator.
 *
 * Flow per turn:
 *   1. Detect language → detect intent → select tone (donor: Verinox)
 *   2. Route to a NEO agent (NIR-WEBSITE agents.ts)
 *   3. Normalize user message, extract entities
 *   4. Ground reply against approved KB (data/neo-kb.json)
 *   5. Lookup advisory guidance based on entities
 *   6. Compile strict prompt 
 *   7. Call FREE AI for live inference
 *   8. On fail, fallback to deterministic legal reply
 *   9. Emit suggested follow-ups for the chatroom UI
 *   10. Log telemetry
 */

import { evaluateMetacognition } from "./intake-state";
import { IntakeState } from "./intake-types";
import { searchKb } from "./kb-search";
import type { KbEntry, NeoAgentId } from "./types";
import { agentById } from "./agents";
import { decideOrchestration } from "./orchestrator-intelligence";
import {
  detectIntent,
  detectLanguage,
  selectTone,
  type NeoIntent,
  type NeoTone,
} from "./communication";
import {
  buildLegalReply,
  renderLegalReply,
  suggestFollowUps,
  type Locale,
  type SuggestedFollowUp,
} from "./legal-reply";
import { nextBestQuestion, type InterviewStyle } from "./intake-questions";
import { normalizeMessage } from "./message-normalizer";
import { lookupAdvisory, formatAdvisoryBlock } from "./advisory-engine";
import { compilePrompt } from "./prompt-compiler";
import { callFreeAI, callFreeAIFallbackLoop, type FreeAIInferResult } from "./freeai-bridge";
import { callSwarmReviewer } from "./swarm-reviewer";
import { enforceOutputSafety, detectHighRiskClaims } from "./enforcement-pipeline";
import { SessionState, createInitialSessionState, mergeSessionState } from "./session-state";
import {
  logTelemetry,
  logComposeStart,
  logComposeComplete,
  logComposeError,
  logTranslatorHit,
  logAdvisoryHit,
  logKbSearch,
  logFreeAiCall,
  logFreeAiSuccess,
  logFreeAiFail,
  logFallbackTriggered,
  logHighRiskClaimDetected,
  logOutputBlocked,
} from "./telemetry";
import { LAWYER_ASSISTANT_PERSONA, getPersonaForAgent } from "./persona";

export type SwarmProvider = "freeai" | "static_fallback";
export type TaskClass =
  | "lightweight_chat"
  | "intake_clarification"
  | "structured_extraction"
  | "summarization"
  | "routing_classification"
  | "high_risk_shaping";

/** Citation surfaced to the UI under each assistant reply. */
export interface NeoCitation {
  id: string;
  title: string;
  href: string | null;
}

interface ReplyOptions {
  message?: string;
  messageHistory?: { role: string; content: string }[];
  currentState?: IntakeState;
  sessionState?: SessionState;
  personaPrompt?: string;
  selectedAgent?: string;
  enforceHydra?: boolean;
  locale?: string;
  uploadedFiles?: string[];
  /** Interview style for the intake ladder. Defaults to adaptive. */
  interviewStyle?: InterviewStyle;
}

export interface SwarmExecutionReceipt {
  mode: string;
  activeNode: string;
  provider: string;
  model: string;
  taskClass: TaskClass;
  durationMs: number;
  fallbacksUsed: number;
  metacognition?: ReturnType<typeof evaluateMetacognition>;
  routedAgent?: string;
  intent?: NeoIntent;
  tone?: NeoTone;
  language?: Locale;
  orchestratorReasoning?: string;
  orchestratorConfidence?: number;
}

function classifyTask(message: string, state?: IntakeState): TaskClass {
  if (!state || state === "DRAFT_DISCOVERY") return "lightweight_chat";
  if (state === "DRAFT_CASE_BUILDING") return "intake_clarification";
  if (state === "PENDING_EMAIL_VERIFICATION") return "structured_extraction";
  if (state === "VERIFIED_READY_FOR_FINAL_REVIEW") return "summarization";
  if (state === "SUBMITTED_FOR_LEGAL_REVIEW") return "routing_classification";
  void message;
  return "lightweight_chat";
}

/** Picks KB entries to ground a reply, preferring the routed agent's primary entries. */
function groundReply(
  message: string,
  routedAgent: string,
  intent: NeoIntent,
): { hits: KbEntry[]; citations: NeoCitation[] } {
  const intentSeeds: Partial<Record<NeoIntent, string>> = {
    greeting: "office orientation lawyers",
    contact_request: "contact phone email address",
    office_question: "lawyers office antwerp",
    scope_question: "services practice areas",
    privacy_question: "privacy gdpr dpo",
    document_question: "document contract review",
    urgency_signal: "urgent contact lawyer",
    out_of_scope: "services lawyers contact",
  };

  const seedQuery =
    intentSeeds[intent] ??
    (message && message.trim().length >= 4 ? message : "services lawyers contact");

  const direct = searchKb(seedQuery, 5);
  const agentMatched = direct.filter((e) => e.primaryAgent === routedAgent);
  const hits = (agentMatched.length > 0 ? agentMatched : direct).slice(0, 3);

  return {
    hits,
    citations: hits.map((h) => ({ id: h.id, title: h.title, href: h.href })),
  };
}

/** Low-risk intents use deterministic replies — avoids fail-closed AI fallback. */
function shouldUseDeterministicReply(intent: NeoIntent): boolean {
  return intent === "greeting" || intent === "out_of_scope";
}

/** Whether to allow contact info in the body, per the strict rule. */
function contactInfoAllowed(intent: NeoIntent, routedAgent: string): boolean {
  return intent === "contact_request" || intent === "urgency_signal" || routedAgent === "contact-router";
}

export interface NeoReply {
  text: string;
  citations: NeoCitation[];
  followUps: SuggestedFollowUp[];
  swarmMeta: SwarmExecutionReceipt;
  updatedSessionState: SessionState;
}

export async function composeNeoReply(options: ReplyOptions): Promise<NeoReply> {
  const startTime = Date.now();
  logComposeStart({ messageLength: options.message?.length || 0 });

  const rawMessage = options.message || "";
  const language: Locale = (options.locale as Locale) || detectLanguage(rawMessage);
  const intent = detectIntent(rawMessage);
  const tone = selectTone(intent);
  const taskClass = classifyTask(rawMessage, options.currentState);
  
  let currentSessionState = options.sessionState || createInitialSessionState();
  currentSessionState = mergeSessionState(currentSessionState, {
    current_task_class: taskClass,
    user_goal: currentSessionState.user_goal || intent
  });

  const orchestration = decideOrchestration({
    message: rawMessage,
    selectedAgent: (options.selectedAgent as NeoAgentId) ?? "auto",
    currentState: options.currentState ?? "DRAFT_DISCOVERY",
    messageHistory:
      options.messageHistory?.map((m) => ({
        role: m.role,
        content: m.content,
      })) ?? [],
    uploadedFiles: options.uploadedFiles ?? [],
  });

  const routed =
    options.selectedAgent && options.selectedAgent !== "auto"
      ? (options.selectedAgent as Exclude<NeoAgentId, "auto">)
      : orchestration.agentId;

  // 1. Message Normalizer
  const normalized = normalizeMessage(rawMessage);
  if (
    normalized.entities.dates.length > 0 ||
    normalized.entities.amounts.length > 0 ||
    normalized.entities.documentTypes.length > 0 ||
    normalized.entities.legalConcepts.length > 0 ||
    normalized.detectedLanguages.length > 1
  ) {
    logTranslatorHit({
      entitiesCount:
        normalized.entities.dates.length +
        normalized.entities.amounts.length +
        normalized.entities.documentTypes.length +
        normalized.entities.legalConcepts.length,
      codeSwitching: normalized.detectedLanguages.length > 1
    });
  }

  // 2. KB Grounding
  const grounded = groundReply(normalized.cleaned, routed, intent);
  logKbSearch({ query: normalized.cleaned, hits: grounded.hits.length });

  const allowContact = contactInfoAllowed(intent, routed);
  const hitsForBody = allowContact
    ? grounded.hits
    : grounded.hits.filter((h) => h.id !== "contact-general");

  // 3. Advisory Engine
  const advisory = lookupAdvisory(
    normalized.cleaned,
    normalized.entities.documentTypes,
    normalized.entities.legalConcepts,
    language
  );
  
  let advisoryContext = "";
  if (advisory) {
    advisoryContext = formatAdvisoryBlock(advisory, language);
    logAdvisoryHit({ guidance: true, category: advisory.category });
  }

  const messages = options.messageHistory?.map((m) => ({
    role: m.role,
    content_redacted: m.content,
  })) || [];

  const metacog = evaluateMetacognition(
    options.currentState || "DRAFT_DISCOVERY",
    messages,
    options.uploadedFiles || [],
  );

  // Deep Session State integration
  currentSessionState = mergeSessionState(currentSessionState, {
    missing_critical_facts: [...new Set([...currentSessionState.missing_critical_facts, ...metacog.missingCritical])],
    evidentiary_gaps: (options.uploadedFiles || []).length === 0 ? ["No documents uploaded"] : []
  });

  const baseReceipt = {
    taskClass,
    metacognition: metacog,
    routedAgent: agentById(routed as never)?.label ?? routed,
    intent,
    tone,
    language,
    orchestratorReasoning: orchestration.reasoning,
    orchestratorConfidence: orchestration.confidence,
  };

  // 4. Prompt Compilation — skip live AI for low-risk conversational intents
  const skipLiveAi = shouldUseDeterministicReply(intent);

  const compiledPrompt = skipLiveAi
    ? ""
    : compilePrompt({
        systemPrompt:
          options.personaPrompt ||
          getPersonaForAgent(routed, taskClass).systemPrompt ||
          LAWYER_ASSISTANT_PERSONA.systemPrompt,
        locale: language,
        tone,
        routedAgent: routed,
        intent,
        userMessage: rawMessage,
        kbHits: hitsForBody,
        metacogSummary: {
          knownFacts: metacog.knownFacts,
          missingCritical: metacog.missingCritical,
          uncertaintyLevel: metacog.uncertaintyLevel,
        },
        messageHistory: messages.map((m) => ({ role: m.role, content: m.content_redacted })),
        translatorAnnotations: normalized.annotationBlock,
        advisoryContext: advisoryContext,
      });

  // 5. FREE AI Bridge (Fallback Loop + Auto-Uplift)
  logFreeAiCall({ persona: "neo_orientation" });
  let freeAiResult: FreeAIInferResult | null = null;
  const aiStartTime = Date.now();

  if (!skipLiveAi) {
    try {
      freeAiResult = await callFreeAIFallbackLoop(compiledPrompt, "neo_orientation");
    } catch (e) {
      freeAiResult = { ok: false, text: "", error: String(e) };
    }
  } else {
    freeAiResult = { ok: false, text: "", error: "Deterministic conversational reply" };
  }

  let finalReplyText = "";
  let mode = "standard";
  let activeNode = "none";
  let provider = "static_fallback";
  let model = "none";
  let fallbacksUsed = 0;
  let sentencesRewritten = 0;
  let unsupportedClaimRate = 0;

  if (freeAiResult?.ok && freeAiResult.text?.trim()) {
    let aiText = freeAiResult.text.trim();
    
    // --- ADVERSARIAL SWARM REVIEWER NODE ---
    const reviewResult = await callSwarmReviewer(aiText, hitsForBody, true);
    if (reviewResult) {
      if (reviewResult.full_rewritten_draft) {
        aiText = reviewResult.full_rewritten_draft;
        activeNode = "swarm_reviewer_correction";
        sentencesRewritten += reviewResult.high_risk_claims.filter(c => !c.supported_by_source).length;
      } else {
        activeNode = "swarm_reviewer_passed";
      }
    } else {
      // Swarm reviewer failed or timed out, fail-closed
      freeAiResult.ok = false;
      freeAiResult.error = "Swarm Reviewer verification failed. Falling back to safe response.";
      aiText = "";
    }
    // ----------------------------------------

    if (freeAiResult.ok && aiText) {
      // OUTPUT ENFORCEMENT PIPELINE
      const enforcement = await enforceOutputSafety(
      aiText,
      hitsForBody,
      currentSessionState,
      routed,
      taskClass,
      language
    );

    if (enforcement.ok) {
        freeAiResult.text = enforcement.text;
        sentencesRewritten += enforcement.sentencesRewritten;
        unsupportedClaimRate = enforcement.unsupportedClaimRate;
        currentSessionState = enforcement.updatedState;
    } else {
        freeAiResult.ok = false;
        freeAiResult.error = enforcement.error;
    }
  }
}

  if (freeAiResult?.ok && freeAiResult.text?.trim()) {
    logFreeAiSuccess({ provider: freeAiResult.provider_id, model: freeAiResult.model_id }, Date.now() - aiStartTime);
    finalReplyText = freeAiResult.text.trim();

    mode = "live_ai";
    activeNode = activeNode || "free_ai_bridge";
    provider = freeAiResult.provider_id || "free_ai";
    model = freeAiResult.model_id || "standard";
  } else {
    logFreeAiFail({ error: freeAiResult?.error }, Date.now() - aiStartTime);
    logFallbackTriggered({ reason: freeAiResult?.error });
    fallbacksUsed = 1;

    // Fallback to deterministic template
    const replyParts = buildLegalReply({
      intent,
      tone,
      locale: language,
      hits: hitsForBody,
      routedAgent: routed,
      message: rawMessage,
    });
    finalReplyText = renderLegalReply(replyParts);
  }

  // --- Interview ladder ----------------------------------------------------
  const inIntakeLadder =
    (options.currentState === "DRAFT_DISCOVERY" || options.currentState === "DRAFT_CASE_BUILDING") &&
    intent !== "contact_request" &&
    intent !== "out_of_scope" &&
    intent !== "greeting";

  if (inIntakeLadder) {
    const lastUser = (options.messageHistory || []).slice().reverse().find((m) => m.role === "user")?.content
      ?? rawMessage;
    const nq = nextBestQuestion({
      report: metacog,
      fileCount: (options.uploadedFiles || []).length,
      lastUserMessage: lastUser,
      locale: language,
      style: options.interviewStyle ?? "adaptive",
    });
    // Add the question if the AI didn't naturally include a question mark at the end
    // (a simple heuristic to avoid double-asking if the AI effectively acted on the metacognition)
    if (nq && !finalReplyText.endsWith("?") && !finalReplyText.match(/\?\s*$/)) {
      finalReplyText = `${finalReplyText}\n\n${nq.prompt}`;
    }
  }

  const followUps = suggestFollowUps({
    intent,
    hits: hitsForBody,
    routedAgent: routed,
    locale: language,
  });

  const durationMs = Date.now() - startTime;
  
  const wasHighRisk = freeAiResult?.text ? detectHighRiskClaims(freeAiResult.text) : false;
  logComposeComplete({ 
    mode, 
    provider,
    selected_persona: routed,
    task_class: taskClass,
    kb_retrieved: hitsForBody.length > 0,
    high_risk_detected: wasHighRisk,
    sentences_rewritten: sentencesRewritten,
    unsupported_claim_rate: unsupportedClaimRate,
    fallback_triggered: fallbacksUsed > 0
  }, durationMs);

  return {
    text: finalReplyText,
    citations: grounded.citations,
    followUps,
    swarmMeta: {
      ...baseReceipt,
      mode,
      activeNode,
      provider,
      model,
      durationMs,
      fallbacksUsed,
    },
    updatedSessionState: currentSessionState
  };
}

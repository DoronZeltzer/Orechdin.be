/**
 * NEO orchestrator intelligence - intent + metacognition driven routing.
 * Replaces naive first-keyword-match with scored, explainable decisions.
 */

import { detectIntent, type NeoIntent } from "./communication";
import { evaluateMetacognition, type MetacognitiveReport } from "./intake-state";
import { NEO_AGENTS, agentById } from "./agents";
import type { IntakeState } from "./intake-types";
import type { NeoAgentId } from "./types";

export interface OrchestratorDecision {
  agentId: Exclude<NeoAgentId, "auto">;
  confidence: number;
  reasoning: string;
  intent: NeoIntent;
  metacognition: MetacognitiveReport;
  signals: string[];
}

const INTENT_AGENT_BIAS: Partial<Record<NeoIntent, Exclude<NeoAgentId, "auto">>> = {
  greeting: "office-navigator",
  contact_request: "contact-router",
  privacy_question: "policy-helper",
  office_question: "office-navigator",
  document_question: "document-helper",
  scope_question: "services-guide",
  urgency_signal: "urgency-triage",
  out_of_scope: "legal-guide",
  clarification: "knowledge-finder",
  general: "intake-assistant",
};

function scoreAgent(
  agentId: Exclude<NeoAgentId, "auto">,
  text: string,
  intent: NeoIntent,
  metacog: MetacognitiveReport,
): { score: number; signals: string[] } {
  const agent = agentById(agentId);
  if (!agent) return { score: 0, signals: [] };

  const q = text.toLowerCase();
  let score = 0;
  const signals: string[] = [];

  for (const kw of agent.keywords) {
    if (q.includes(kw)) {
      score += 3;
      signals.push(`keyword:${kw}`);
    }
  }

  if (INTENT_AGENT_BIAS[intent] === agentId) {
    score += 5;
    signals.push(`intent:${intent}`);
  }

  if (metacog.uncertaintyLevel === "HIGH" && agentId === "intake-assistant") {
    score += 4;
    signals.push("metacog:high_uncertainty");
  }
  if (metacog.repeatedQuestionRisk && agentId === "legal-guide") {
    score += 3;
    signals.push("metacog:repeated_question");
  }
  if (metacog.missingCritical.some((m) => /timeline|date/i.test(m)) && agentId === "urgency-triage") {
    score += 2;
    signals.push("metacog:timeline_gap");
  }
  if (metacog.summaryCompleteness >= 60 && agentId === "legal-analyst") {
    score += 2;
    signals.push("metacog:ready_for_analysis");
  }
  if (/\b(international|foreign|abroad|cross-border)\b/i.test(q) && agentId === "cross-border-strategist") {
    score += 6;
    signals.push("topic:cross_border");
  }
  if (/\b(damage|compensation|severance|insolvency)\b/i.test(q) && agentId === "financial-modeler") {
    score += 5;
    signals.push("topic:financial");
  }
  if (/\b(mediation|settlement|negotiat)\b/i.test(q) && agentId === "strategic-advisor") {
    score += 5;
    signals.push("topic:strategy");
  }

  return { score, signals };
}

export function decideOrchestration(args: {
  message: string;
  selectedAgent: NeoAgentId;
  currentState: IntakeState;
  messageHistory: { role: string; content: string }[];
  uploadedFiles: string[];
}): OrchestratorDecision {
  const intent = detectIntent(args.message);
  const metacognition = evaluateMetacognition(
    args.currentState,
    args.messageHistory.map((m) => ({
      role: m.role,
      content_redacted: m.content,
    })),
    args.uploadedFiles,
  );

  if (args.selectedAgent !== "auto") {
    const fixed = args.selectedAgent;
    return {
      agentId: fixed,
      confidence: 1,
      reasoning: `Fixed mode: ${agentById(fixed)?.label ?? fixed}`,
      intent,
      metacognition,
      signals: ["user:fixed_mode"],
    };
  }

  let best: Exclude<NeoAgentId, "auto"> = INTENT_AGENT_BIAS[intent] ?? "legal-guide";
  let bestScore = 0;
  let bestSignals: string[] = [];

  for (const agent of NEO_AGENTS) {
    const { score, signals } = scoreAgent(agent.id, args.message, intent, metacognition);
    if (score > bestScore) {
      bestScore = score;
      best = agent.id;
      bestSignals = signals;
    }
  }

  if (bestScore === 0) {
    best = routeFallback(intent, metacognition);
    bestSignals = [`fallback:${intent}`];
  }

  const confidence = Math.min(1, bestScore / 10 + 0.35);
  const agentLabel = agentById(best)?.label ?? best;

  return {
    agentId: best,
    confidence,
    reasoning: buildReasoning(intent, metacognition, agentLabel, bestSignals),
    intent,
    metacognition,
    signals: bestSignals,
  };
}

function routeFallback(
  intent: NeoIntent,
  metacog: MetacognitiveReport,
): Exclude<NeoAgentId, "auto"> {
  if (metacog.uncertaintyLevel === "HIGH") return "intake-assistant";
  return INTENT_AGENT_BIAS[intent] ?? "legal-guide";
}

function buildReasoning(
  intent: NeoIntent,
  metacog: MetacognitiveReport,
  agentLabel: string,
  signals: string[],
): string {
  const parts: string[] = [`Intent: ${intent.replace(/_/g, " ")}`];
  parts.push(`Uncertainty: ${metacog.uncertaintyLevel}`);
  if (metacog.missingCritical.length > 0) {
    parts.push(`Gap: ${metacog.missingCritical[0]}`);
  }
  parts.push(`→ ${agentLabel}`);
  if (signals.length > 0) {
    parts.push(`(${signals.slice(0, 3).join(", ")})`);
  }
  return parts.join(" · ");
}

/** Live snapshot for UI - no message required. */
export function liveOrchestratorSnapshot(args: {
  messages: { role: string; content_redacted: string }[];
  currentState: IntakeState;
  uploadedFiles: string[];
  selectedAgent: NeoAgentId;
  lastRoutedAgent?: Exclude<NeoAgentId, "auto">;
}): {
  metacognition: MetacognitiveReport;
  activeAgent: Exclude<NeoAgentId, "auto">;
  nextAction: string;
} {
  const lastUser =
    [...args.messages].reverse().find((m) => m.role === "user")?.content_redacted ?? "";
  const decision = decideOrchestration({
    message: lastUser || "hello",
    selectedAgent: args.selectedAgent,
    currentState: args.currentState,
    messageHistory: args.messages.map((m) => ({
      role: m.role,
      content: m.content_redacted,
    })),
    uploadedFiles: args.uploadedFiles,
  });

  return {
    metacognition: decision.metacognition,
    activeAgent: args.lastRoutedAgent ?? decision.agentId,
    nextAction: decision.metacognition.nextBestAction,
  };
}

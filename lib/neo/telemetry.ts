export type TelemetryEventType =
  | "compose_start"
  | "compose_complete"
  | "compose_error"
  | "translator_hit"
  | "advisory_hit"
  | "kb_search"
  | "freeai_call"
  | "freeai_success"
  | "freeai_fail"
  | "node_cooldown"
  | "fallback_triggered"
  | "high_risk_claim_detected"
  | "output_blocked";

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: TelemetryEventType;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export interface TelemetryDashboard {
  swarm: {
    totalInferences: number;
    liveAiReplies: number;
    templateFallbacks: number;
    avgDurationMs: number;
    failureRate: number;
    sentencesRewritten: number;
  };
  qa: {
    falsePositiveGateRate: number; // Placeholder for explicit QA feedback
    falseNegativeRate: number;     // Placeholder for explicit QA feedback
    unsupportedClaimRate: number;
  };
  translator: {
    totalCalls: number;
    entitiesExtracted: number;
  };
  advisory: {
    totalLookups: number;
    guidanceInjected: number;
  };
  kb: {
    totalSearches: number;
    avgHitsPerSearch: number;
    zeroHitRate: number;
  };
}

const eventLog: TelemetryEvent[] = [];
const MAX_EVENTS = 500;

export function logTelemetry(
  type: TelemetryEventType,
  data?: Record<string, unknown>,
  durationMs?: number
): void {
  const event: TelemetryEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    data,
    durationMs,
  };
  eventLog.unshift(event);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.pop();
  }
}

// Convenience loggers
export const logComposeStart = (data?: Record<string, unknown>) => logTelemetry("compose_start", data);
export const logComposeComplete = (data?: Record<string, unknown>, durationMs?: number) => logTelemetry("compose_complete", data, durationMs);
export const logComposeError = (data?: Record<string, unknown>, durationMs?: number) => logTelemetry("compose_error", data, durationMs);
export const logTranslatorHit = (data?: Record<string, unknown>) => logTelemetry("translator_hit", data);
export const logAdvisoryHit = (data?: Record<string, unknown>) => logTelemetry("advisory_hit", data);
export const logKbSearch = (data?: Record<string, unknown>) => logTelemetry("kb_search", data);
export const logFreeAiCall = (data?: Record<string, unknown>) => logTelemetry("freeai_call", data);
export const logFreeAiSuccess = (data?: Record<string, unknown>, durationMs?: number) => logTelemetry("freeai_success", data, durationMs);
export const logFreeAiFail = (data?: Record<string, unknown>, durationMs?: number) => logTelemetry("freeai_fail", data, durationMs);
export const logNodeCooldown = (data?: Record<string, unknown>) => logTelemetry("node_cooldown", data);
export const logFallbackTriggered = (data?: Record<string, unknown>) => logTelemetry("fallback_triggered", data);
export const logHighRiskClaimDetected = (data?: Record<string, unknown>) => logTelemetry("high_risk_claim_detected", data);
export const logOutputBlocked = (data?: Record<string, unknown>) => logTelemetry("output_blocked", data);

export function getRecentEvents(limit: number = 50): TelemetryEvent[] {
  return eventLog.slice(0, limit);
}

export function getDashboard(): TelemetryDashboard {
  const defaults: TelemetryDashboard = {
    swarm: { totalInferences: 0, liveAiReplies: 0, templateFallbacks: 0, avgDurationMs: 0, failureRate: 0, sentencesRewritten: 0 },
    qa: { falsePositiveGateRate: 0, falseNegativeRate: 0, unsupportedClaimRate: 0 },
    translator: { totalCalls: 0, entitiesExtracted: 0 },
    advisory: { totalLookups: 0, guidanceInjected: 0 },
    kb: { totalSearches: 0, avgHitsPerSearch: 0, zeroHitRate: 0 },
  };

  if (eventLog.length === 0) return defaults;

  let totalDuration = 0;
  let durationCount = 0;
  let fails = 0;
  let searches = 0;
  let zeroHits = 0;
  let totalHits = 0;

  for (const ev of eventLog) {
    if (ev.type === "freeai_success") {
      defaults.swarm.totalInferences++;
      defaults.swarm.liveAiReplies++;
      if (ev.durationMs) {
        totalDuration += ev.durationMs;
        durationCount++;
      }
    } else if (ev.type === "freeai_fail") {
      defaults.swarm.totalInferences++;
      fails++;
    } else if (ev.type === "fallback_triggered") {
      defaults.swarm.templateFallbacks++;
    } else if (ev.type === "high_risk_claim_detected" && ev.data?.trigger === "reviewer") {
      if (ev.data.sentencesRewritten) {
        defaults.swarm.sentencesRewritten += Number(ev.data.sentencesRewritten);
      }
    } else if (ev.type === "compose_complete" && ev.data?.unsupported_claim_rate) {
       // Just a simple rolling average for demonstration
       defaults.qa.unsupportedClaimRate = (defaults.qa.unsupportedClaimRate + Number(ev.data.unsupported_claim_rate)) / 2;
    } else if (ev.type === "translator_hit") {
      defaults.translator.totalCalls++;
      if (ev.data?.entitiesCount) {
        defaults.translator.entitiesExtracted += Number(ev.data.entitiesCount);
      }
    } else if (ev.type === "advisory_hit") {
      defaults.advisory.totalLookups++;
      if (ev.data?.guidance) {
        defaults.advisory.guidanceInjected++;
      }
    } else if (ev.type === "kb_search") {
      searches++;
      const hits = Number(ev.data?.hits || 0);
      totalHits += hits;
      if (hits === 0) zeroHits++;
    }
  }

  defaults.swarm.avgDurationMs = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
  defaults.swarm.failureRate = defaults.swarm.totalInferences > 0 ? fails / defaults.swarm.totalInferences : 0;
  defaults.kb.totalSearches = searches;
  defaults.kb.avgHitsPerSearch = searches > 0 ? totalHits / searches : 0;
  defaults.kb.zeroHitRate = searches > 0 ? zeroHits / searches : 0;

  return defaults;
}

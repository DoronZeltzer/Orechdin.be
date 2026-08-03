import type { ResolutionStepReceipt, ResponseState, RouteReceipt } from "./types";

export interface ResolutionOutcome {
  state: ResponseState;
  text: string | null;
  bucket: "local" | "cloud" | null;
  retry_after_seconds?: number | null;
  setup_required?: boolean;
}

export function resolutionEscalationReceipt(args: {
  request_id: string;
  from_level: number;
  to_level: number;
  reason_code: string;
}): ResolutionStepReceipt {
  return {
    receipt_type: "cascade_resolution_escalation",
    request_id: args.request_id,
    from_level: args.from_level,
    to_level: args.to_level,
    reason_code: args.reason_code,
    timestamp_utc: new Date().toISOString(),
  };
}

export function terminalOutcomeFromReceipts(
  receipts: RouteReceipt[],
  hasSetupRequired: boolean,
): ResolutionOutcome {
  if (hasSetupRequired) {
    return {
      state: "setup_required",
      text: null,
      bucket: "local",
    };
  }

  const queued = receipts.find((r) => r.status === "queued");
  if (queued) {
    return {
      state: "queued",
      text: null,
      bucket: "cloud",
      retry_after_seconds: queued.retry_after_seconds,
    };
  }

  const degraded = receipts.find((r) => r.status === "degraded");
  if (degraded) {
    return {
      state: "degraded",
      text: null,
      bucket: "cloud",
      retry_after_seconds: degraded.retry_after_seconds,
    };
  }

  return {
    state: "unavailable",
    text: null,
    bucket: null,
  };
}

export function bucketForProvider(providerId: string): "local" | "cloud" {
  return providerId === "ollama" ? "local" : "cloud";
}

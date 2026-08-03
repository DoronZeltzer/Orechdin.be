import type { UnifiedCascadeResult } from "./types";

/** User-facing API hardening (R6): local/cloud bucket + state + text only. */
export function toPublicCascadeResponse(result: UnifiedCascadeResult) {
  return {
    state: result.state,
    text: result.text,
    bucket: result.bucket,
    retry_after_seconds: result.retry_after_seconds ?? null,
    setup_suggestions: result.setup_suggestions ?? [],
    request_id: result.request_id,
  };
}

/** Admin diagnostics — full snapshot with receipts. */
export function toAdminCascadeResponse(result: UnifiedCascadeResult) {
  return {
    ...toPublicCascadeResponse(result),
    receipts: result.receipts,
    resolution_history: result.resolution_history,
    cascade_state: result.cascade_state,
  };
}

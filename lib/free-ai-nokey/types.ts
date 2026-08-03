export type TaskType = "chat" | "image" | "local_task";

export type RouterMode =
  | "power_first"
  | "speed_first"
  | "private_first"
  | "image"
  | "local_task";

export type ExecutionPlane = "server" | "browser" | "mobile";

export type ResponseState =
  | "answer"
  | "cached_answer"
  | "queued"
  | "setup_required"
  | "degraded"
  | "unavailable"
  | "error";

export type ProviderClass =
  | "no_developer_key_wrapper"
  | "public_no_key_url"
  | "browser_local_ai"
  | "local_model_runtime"
  | "public_space_no_token"
  | "anonymous_placeholder_provider";

export type LocalVsCloudPriority =
  | "local_preferred"
  | "cloud_preferred"
  | "balanced"
  | "auto";

export type ReasoningDepth = "shallow" | "standard" | "deep";

export type CascadePhase = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type FallbackDecision =
  | "accepted"
  | "failed_continue"
  | "skipped_continue"
  | "circuit_open_skip";

export type ReceiptStatus =
  | "success"
  | "queued"
  | "degraded"
  | "unavailable"
  | "error"
  | "skipped";

export interface IntentProfile {
  privacy_sensitive: boolean;
  offline_required: boolean;
  latency_sensitive: boolean;
  reasoning_depth: ReasoningDepth;
  creative_generation: boolean;
  factual_grounding_required: boolean;
  multimodal: boolean;
}

export interface RouteReceipt {
  receipt_type: "no_developer_key_provider_attempt";
  receipt_id: string;
  timestamp_utc: string;
  source_type: "provider" | "local_runtime" | "typed_unavailable";
  provider_id: string;
  runtime_id: string | null;
  model_id: string | null;
  route: TaskType;
  provider_class: ProviderClass;
  router_mode: RouterMode;
  free_mode: true;
  requires_personal_key: false;
  paid_fallback_used: false;
  status: ReceiptStatus;
  safe_reason_code: string;
  latency_ms: number;
  retry_after_seconds: number | null;
  fallback_decision: FallbackDecision;
  secret_redaction_verified: true;
  simple_url_mode?: boolean;
  browser_runtime_unavailable?: boolean;
}

export interface ResolutionStepReceipt {
  receipt_type: "cascade_resolution_escalation";
  request_id: string;
  from_level: number;
  to_level: number;
  reason_code: string;
  timestamp_utc: string;
}

export interface UnifiedCascadeState {
  schema_version: "1.0.0";
  request_id: string;
  timestamp_utc: string;
  phase_completed: CascadePhase;
  task: TaskType;
  router_mode: RouterMode;
  execution_plane: ExecutionPlane;
  intent_profile: IntentProfile;
  local_vs_cloud_priority: LocalVsCloudPriority;
  local_vs_cloud_reason: string;
  privacy_tier: "local" | "browser" | "public_no_key";
  planes_engaged: string[];
  capacity_snapshot_ref: string | null;
  sanitize_report_ref: string | null;
  unified_provider_queue: string[];
  resolution_level: number;
  resolution_history: ResolutionStepReceipt[];
  sub_agent_chain: string[];
  attempt_count: number;
  route_receipt_ids: string[];
  delegation_receipt_ids: string[];
  rag_context_ref: string | null;
  final_state: ResponseState | null;
  proof_status: "POLICY_DEFINED" | "IMPLEMENTATION_PROVEN" | "BLOCKED";
}

export interface SanitizeReport {
  allowed_to_route_externally: boolean;
  blocked_reason: string | null;
  secret_patterns_detected: boolean;
  prompt_hash: string;
}

export interface CapacitySnapshot {
  ollama_ready: boolean;
  ollama_models: string[];
  endpoint_snapshot_ref: string | null;
}

export interface UnifiedCascadeRequest {
  prompt: string;
  task?: TaskType;
  router_mode?: RouterMode | null;
  execution_plane?: ExecutionPlane;
  use_local?: boolean | null;
  model?: string | null;
  rag_context?: Record<string, unknown> | null;
  parent_request_id?: string | null;
  /** Inject fetch for tests */
  fetchImpl?: typeof fetch;
  /** Force all adapters to fail (tests) */
  force_fail?: boolean;
}

export interface UnifiedCascadeResult {
  state: ResponseState;
  text: string | null;
  bucket: "local" | "cloud" | null;
  setup_suggestions?: string[];
  retry_after_seconds?: number | null;
  request_id: string;
  receipts: RouteReceipt[];
  resolution_history: ResolutionStepReceipt[];
  cascade_state: UnifiedCascadeState;
}

export interface ProviderDefinition {
  id: string;
  label: string;
  route: TaskType;
  provider_class: ProviderClass;
  execution_planes: ExecutionPlane[];
  tier: "local" | "cloud";
  timeout_ms: number;
  enabled: boolean;
}

export interface AdapterRunResult {
  ok: boolean;
  text?: string;
  status: ReceiptStatus;
  safe_reason_code: string;
  model_id?: string | null;
  runtime_id?: string | null;
  retry_after_seconds?: number | null;
  setup_required?: boolean;
}

export interface AdapterContext {
  prompt: string;
  task: TaskType;
  router_mode: RouterMode;
  execution_plane: ExecutionPlane;
  model?: string | null;
  fetchImpl: typeof fetch;
  force_fail?: boolean;
}

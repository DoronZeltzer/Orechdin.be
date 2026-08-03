import { buildRouteReceipt, probeOllama, runProviderAdapter } from "./adapters";
import { classifyIntake, alternateRouterMode } from "./intent";
import { buildUnifiedProviderQueue, setupSuggestions } from "./merge";
import { getProvider } from "./providers";
import {
  bucketForProvider,
  resolutionEscalationReceipt,
  terminalOutcomeFromReceipts,
} from "./resolution";
import { sanitizePrompt } from "./sanitize";
import {
  cacheKey,
  createRequestId,
  globalCircuitBreaker,
  globalResponseCache,
  redactSecrets,
} from "./resilience";
import type {
  CapacitySnapshot,
  ResolutionStepReceipt,
  RouteReceipt,
  UnifiedCascadeRequest,
  UnifiedCascadeResult,
  UnifiedCascadeState,
} from "./types";

function initialState(requestId: string): UnifiedCascadeState {
  return {
    schema_version: "1.0.0",
    request_id: requestId,
    timestamp_utc: new Date().toISOString(),
    phase_completed: "A",
    task: "chat",
    router_mode: "power_first",
    execution_plane: "server",
    intent_profile: {
      privacy_sensitive: false,
      offline_required: false,
      latency_sensitive: false,
      reasoning_depth: "standard",
      creative_generation: false,
      factual_grounding_required: false,
      multimodal: false,
    },
    local_vs_cloud_priority: "auto",
    local_vs_cloud_reason: "",
    privacy_tier: "public_no_key",
    planes_engaged: ["0D"],
    capacity_snapshot_ref: null,
    sanitize_report_ref: null,
    unified_provider_queue: [],
    resolution_level: 1,
    resolution_history: [],
    sub_agent_chain: [],
    attempt_count: 0,
    route_receipt_ids: [],
    delegation_receipt_ids: [],
    rag_context_ref: null,
    final_state: null,
    proof_status: "POLICY_DEFINED",
  };
}

async function phaseA(fetchImpl: typeof fetch): Promise<CapacitySnapshot> {
  const ollama = await probeOllama(fetchImpl);
  return {
    ollama_ready: ollama.ready,
    ollama_models: ollama.models,
    endpoint_snapshot_ref: null,
  };
}

async function executeQueue(args: {
  queue: string[];
  prompt: string;
  task: UnifiedCascadeState["task"];
  router_mode: UnifiedCascadeState["router_mode"];
  execution_plane: UnifiedCascadeState["execution_plane"];
  model?: string | null;
  fetchImpl: typeof fetch;
  force_fail?: boolean;
  request_id: string;
}): Promise<{
  receipts: RouteReceipt[];
  text: string | null;
  bucket: "local" | "cloud" | null;
  state: UnifiedCascadeResult["state"];
  setup_required: boolean;
  retry_after_seconds?: number | null;
}> {
  const receipts: RouteReceipt[] = [];
  let setupRequired = false;

  for (const providerId of args.queue) {
    const def = getProvider(providerId);
    if (!def) continue;

    if (globalCircuitBreaker.isOpen(providerId)) {
      receipts.push(
        buildRouteReceipt({
          provider_id: providerId,
          provider_class: def.provider_class,
          router_mode: args.router_mode,
          route: args.task,
          status: "skipped",
          safe_reason_code: "provider_unavailable",
          latency_ms: 0,
          fallback_decision: "circuit_open_skip",
        }),
      );
      continue;
    }

    const started = Date.now();
    const result = await runProviderAdapter(providerId, {
      prompt: args.prompt,
      task: args.task,
      router_mode: args.router_mode,
      execution_plane: args.execution_plane,
      model: args.model,
      fetchImpl: args.fetchImpl,
      force_fail: args.force_fail,
    });
    const latency = Date.now() - started;

    const receipt = buildRouteReceipt({
      provider_id: providerId,
      provider_class: def.provider_class,
      router_mode: args.router_mode,
      route: args.task,
      status: result.status,
      safe_reason_code: result.safe_reason_code,
      latency_ms: latency,
      fallback_decision: result.ok ? "accepted" : "failed_continue",
      model_id: result.model_id,
      runtime_id: result.runtime_id,
      retry_after_seconds: result.retry_after_seconds,
      simple_url_mode: providerId.startsWith("pollinations"),
      browser_runtime_unavailable: result.safe_reason_code === "browser_runtime_unavailable",
    });
    receipts.push(receipt);

    if (result.ok && result.text?.trim()) {
      globalCircuitBreaker.recordSuccess(providerId);
      return {
        receipts,
        text: redactSecrets(result.text.trim()),
        bucket: bucketForProvider(providerId),
        state: "answer",
        setup_required: false,
      };
    }

    globalCircuitBreaker.recordFailure(providerId);
    if (result.setup_required) setupRequired = true;
    if (result.status === "queued") {
      return {
        receipts,
        text: null,
        bucket: "cloud",
        state: "queued",
        setup_required: setupRequired,
        retry_after_seconds: result.retry_after_seconds,
      };
    }
  }

  const terminal = terminalOutcomeFromReceipts(receipts, setupRequired);
  return {
    receipts,
    text: terminal.text,
    bucket: terminal.bucket,
    state: terminal.state,
    setup_required: setupRequired,
    retry_after_seconds: terminal.retry_after_seconds,
  };
}

export async function unifiedFreeAiGenerate(
  request: UnifiedCascadeRequest,
): Promise<UnifiedCascadeResult> {
  const fetchImpl = request.fetchImpl ?? fetch;
  const requestId = createRequestId();
  const state = initialState(requestId);
  const resolutionHistory: ResolutionStepReceipt[] = [];
  const allReceipts: RouteReceipt[] = [];

  // Phase A — capacity
  const capacity = await phaseA(fetchImpl);
  state.phase_completed = "A";
  state.capacity_snapshot_ref = capacity.endpoint_snapshot_ref;

  // Phase B — intake
  const sanitizePreview = sanitizePrompt(request.prompt);
  const intake = classifyIntake({
    prompt: request.prompt,
    task: request.task,
    router_mode: request.router_mode,
    execution_plane: request.execution_plane,
    use_local: request.use_local,
    sanitizeBlocksExternal: !sanitizePreview.allowed_to_route_externally,
    ollamaReady: capacity.ollama_ready,
  });
  state.phase_completed = "B";
  state.task = intake.task;
  state.router_mode = intake.router_mode;
  state.execution_plane = intake.execution_plane;
  state.intent_profile = intake.intent_profile;
  state.local_vs_cloud_priority = intake.local_vs_cloud_priority;
  state.local_vs_cloud_reason = intake.local_vs_cloud_reason;

  // Phase C — sanitize
  const sanitize = sanitizePrompt(request.prompt);
  state.phase_completed = "C";
  state.sanitize_report_ref = sanitize.prompt_hash;

  if (!sanitize.allowed_to_route_externally && !capacity.ollama_ready) {
    state.phase_completed = "G";
    state.final_state = "unavailable";
    return {
      state: "unavailable",
      text: null,
      bucket: null,
      setup_suggestions: [
        "Prompt contains blocked secret patterns and no local runtime is ready.",
      ],
      request_id: requestId,
      receipts: allReceipts,
      resolution_history: resolutionHistory,
      cascade_state: state,
    };
  }

  // Phase D — merge queue
  let queue = buildUnifiedProviderQueue({
    task: intake.task,
    router_mode: intake.router_mode,
    execution_plane: intake.execution_plane,
    local_vs_cloud_priority: intake.local_vs_cloud_priority,
    sanitize,
    capacity,
  });
  state.phase_completed = "D";
  state.unified_provider_queue = queue;

  // Cache check (before Phase E)
  const key = cacheKey(request.prompt, intake.task, intake.router_mode, request.model);
  if (!globalResponseCache.disabled() && !request.force_fail) {
    const cached = globalResponseCache.get(key);
    if (cached) {
      state.phase_completed = "G";
      state.final_state = "cached_answer";
      return {
        state: "cached_answer",
        text: cached,
        bucket: "cloud",
        request_id: requestId,
        receipts: allReceipts,
        resolution_history: resolutionHistory,
        cascade_state: state,
      };
    }
  }

  // Phase F — optional RAG augment (prepend context to prompt)
  let effectivePrompt = request.prompt;
  if (request.rag_context && Object.keys(request.rag_context).length > 0) {
    state.rag_context_ref = "inline";
    effectivePrompt = `${JSON.stringify(request.rag_context)}\n\n${request.prompt}`;
    state.planes_engaged.push("0E");
  }
  state.phase_completed = "F";

  // Phase E — R1 direct provider walk
  state.resolution_level = 1;
  const ollamaModel =
    request.model ?? (capacity.ollama_models[0] || null);
  let exec = await executeQueue({
    queue,
    prompt: effectivePrompt,
    task: intake.task,
    router_mode: intake.router_mode,
    execution_plane: intake.execution_plane,
    model: ollamaModel,
    fetchImpl,
    force_fail: request.force_fail,
    request_id: requestId,
  });
  allReceipts.push(...exec.receipts);
  state.attempt_count += exec.receipts.length;
  state.route_receipt_ids.push(...exec.receipts.map((r) => r.receipt_id));
  state.phase_completed = "E";

  // R3 — router mode shift if R1 exhausted
  if (exec.state !== "answer" && exec.state !== "cached_answer" && exec.state !== "queued") {
    const alt = alternateRouterMode(intake.router_mode);
    if (alt) {
      resolutionHistory.push(
        resolutionEscalationReceipt({
          request_id: requestId,
          from_level: 1,
          to_level: 3,
          reason_code: "mode_shift",
        }),
      );
      state.resolution_level = 3;
      queue = buildUnifiedProviderQueue({
        task: intake.task,
        router_mode: alt,
        execution_plane: intake.execution_plane,
        local_vs_cloud_priority: intake.local_vs_cloud_priority,
        sanitize,
        capacity,
      });
      exec = await executeQueue({
        queue,
        prompt: effectivePrompt,
        task: intake.task,
        router_mode: alt,
        execution_plane: intake.execution_plane,
        model: ollamaModel,
        fetchImpl,
        force_fail: request.force_fail,
        request_id: requestId,
      });
      allReceipts.push(...exec.receipts);
      state.attempt_count += exec.receipts.length;
      state.route_receipt_ids.push(...exec.receipts.map((r) => r.receipt_id));
    }
  }

  // R6 — terminal if still no answer
  if (exec.state !== "answer" && exec.state !== "cached_answer") {
    resolutionHistory.push(
      resolutionEscalationReceipt({
        request_id: requestId,
        from_level: state.resolution_level,
        to_level: 6,
        reason_code: "terminal",
      }),
    );
    state.resolution_level = 6;
  }

  if (exec.text && exec.state === "answer" && !globalResponseCache.disabled()) {
    globalResponseCache.set(key, exec.text);
  }

  // Phase G — respond
  state.phase_completed = "G";
  state.final_state = exec.state;
  state.resolution_history = resolutionHistory;

  return {
    state: exec.state,
    text: exec.text,
    bucket: exec.bucket,
    setup_suggestions:
      exec.state === "setup_required" || exec.state === "unavailable"
        ? setupSuggestions({
            queue: state.unified_provider_queue,
            ollama_ready: capacity.ollama_ready,
            execution_plane: intake.execution_plane,
          })
        : undefined,
    retry_after_seconds: exec.retry_after_seconds,
    request_id: requestId,
    receipts: allReceipts,
    resolution_history: resolutionHistory,
    cascade_state: state,
  };
}

export async function getStatusSnapshot(fetchImpl: typeof fetch = fetch) {
  const ollama = await probeOllama(fetchImpl);
  return {
    module: "M05",
    proof_status: "IMPLEMENTATION_PROVEN" as const,
    router_modes: ["power_first", "speed_first", "private_first", "image", "local_task"],
    execution_plane_default: "server",
    ollama_ready: ollama.ready,
    ollama_models: ollama.models,
    gradio_enabled: process.env.FREEAI_NOKEY_GRADIO_ENABLED === "true",
    ai_horde_enabled: process.env.FREEAI_NOKEY_AIHORDE_ENABLED === "true",
    cache_disabled: process.env.FREEAI_NOKEY_CACHE_DISABLED === "true",
    blocked_keys_in_plane: [
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "OPENROUTER_API_KEY",
      "GEMINI_API_KEY",
    ],
  };
}

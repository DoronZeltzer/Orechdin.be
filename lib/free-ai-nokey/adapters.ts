import { getProvider } from "./providers";
import type {
  AdapterContext,
  AdapterRunResult,
  ExecutionPlane,
  ProviderClass,
  RouteReceipt,
  RouterMode,
  TaskType,
} from "./types";
import { createReceiptId } from "./resilience";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function probeOllama(
  fetchImpl: typeof fetch = fetch,
): Promise<{ ready: boolean; models: string[] }> {
  try {
    const res = await fetchImpl(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ready: false, models: [] };
    const json = (await res.json()) as { models?: { name: string }[] };
    const models = (json.models ?? []).map((m) => m.name);
    return { ready: models.length > 0, models };
  } catch {
    return { ready: false, models: [] };
  }
}

async function runPollinationsText(ctx: AdapterContext): Promise<AdapterRunResult> {
  if (ctx.force_fail) {
    return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
  }

  const encoded = encodeURIComponent(ctx.prompt.slice(0, 8000));
  const simpleUrl = `https://gen.pollinations.ai/text/${encoded}`;

  try {
    const res = await withTimeout(
      ctx.fetchImpl(simpleUrl, { method: "GET" }),
      28000,
      "pollinations_text",
    );
    if (!res.ok) {
      return {
        ok: false,
        status: res.status === 429 ? "degraded" : "error",
        safe_reason_code:
          res.status === 429 ? "public_endpoint_rate_limited" : "provider_unavailable",
        retry_after_seconds: res.status === 429 ? 30 : undefined,
      };
    }
    const text = (await res.text()).trim();
    if (!text) {
      return { ok: false, status: "unavailable", safe_reason_code: "provider_unavailable" };
    }
    return {
      ok: true,
      text,
      status: "success",
      safe_reason_code: "accepted",
      model_id: "gen.pollinations.ai/text",
    };
  } catch {
    // POST fallback — still no Authorization header (0D compliant)
    try {
      const res = await withTimeout(
        ctx.fetchImpl("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai",
            search: false,
            messages: [{ role: "user", content: ctx.prompt }],
          }),
        }),
        28000,
        "pollinations_text_post",
      );
      if (!res.ok) {
        return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
      }
      const text = (await res.text()).trim();
      if (!text) {
        return { ok: false, status: "unavailable", safe_reason_code: "provider_unavailable" };
      }
      return {
        ok: true,
        text,
        status: "success",
        safe_reason_code: "accepted",
        model_id: "text.pollinations.ai",
      };
    } catch {
      return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
    }
  }
}

async function runPollinationsImage(ctx: AdapterContext): Promise<AdapterRunResult> {
  if (ctx.force_fail) {
    return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
  }
  const encoded = encodeURIComponent(ctx.prompt.slice(0, 4000));
  const url = `https://gen.pollinations.ai/image/${encoded}`;
  try {
    const res = await withTimeout(ctx.fetchImpl(url, { method: "GET" }), 40000, "pollinations_image");
    if (!res.ok) {
      return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
    }
    return {
      ok: true,
      text: url,
      status: "success",
      safe_reason_code: "accepted",
      model_id: "gen.pollinations.ai/image",
    };
  } catch {
    return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
  }
}

async function runOllama(ctx: AdapterContext): Promise<AdapterRunResult> {
  if (ctx.force_fail) {
    return { ok: false, status: "error", safe_reason_code: "local_model_unavailable" };
  }
  const model = ctx.model ?? OLLAMA_DEFAULT_MODEL;
  try {
    const res = await withTimeout(
      ctx.fetchImpl(`${OLLAMA_HOST}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [{ role: "user", content: ctx.prompt }],
        }),
      }),
      55000,
      "ollama",
    );
    if (!res.ok) {
      return {
        ok: false,
        status: "error",
        safe_reason_code: "local_model_unavailable",
        setup_required: res.status === 404,
        model_id: model,
        runtime_id: "ollama",
      };
    }
    const json = (await res.json()) as { message?: { content?: string } };
    const text = json.message?.content?.trim() ?? "";
    if (!text) {
      return {
        ok: false,
        status: "unavailable",
        safe_reason_code: "local_model_unavailable",
        runtime_id: "ollama",
      };
    }
    return {
      ok: true,
      text,
      status: "success",
      safe_reason_code: "accepted",
      model_id: model,
      runtime_id: "ollama",
    };
  } catch {
    return {
      ok: false,
      status: "error",
      safe_reason_code: "local_model_unavailable",
      runtime_id: "ollama",
    };
  }
}

async function runAiHorde(ctx: AdapterContext): Promise<AdapterRunResult> {
  if (ctx.force_fail) {
    return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
  }
  try {
    const res = await withTimeout(
      ctx.fetchImpl("https://stablehorde.net/api/v2/generate/text/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 0000000000",
        },
        body: JSON.stringify({
          prompt: ctx.prompt,
          params: { max_length: 512 },
          models: ["LLaMA-Hardcore-LoLLMS"],
        }),
      }),
      15000,
      "ai_horde_submit",
    );
    if (!res.ok) {
      return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
    }
    const submit = (await res.json()) as { id?: string };
    if (!submit.id) {
      return { ok: false, status: "queued", safe_reason_code: "anonymous_queue_timeout" };
    }
    return {
      ok: false,
      status: "queued",
      safe_reason_code: "anonymous_queue_timeout",
      retry_after_seconds: 60,
    };
  } catch {
    return { ok: false, status: "error", safe_reason_code: "provider_unavailable" };
  }
}

function skipBrowser(
  providerId: string,
  plane: ExecutionPlane,
  providerClass: ProviderClass,
): AdapterRunResult {
  void providerId;
  return {
    ok: false,
    status: "skipped",
    safe_reason_code:
      plane === "server" ? "browser_runtime_unavailable" : "provider_unavailable",
  };
}

export async function runProviderAdapter(
  providerId: string,
  ctx: AdapterContext,
): Promise<AdapterRunResult> {
  const def = getProvider(providerId);
  if (!def) {
    return { ok: false, status: "error", safe_reason_code: "no_provider_meets_requirements" };
  }

  if (
    ctx.execution_plane === "server" &&
    !def.execution_planes.includes("server")
  ) {
    return skipBrowser(providerId, ctx.execution_plane, def.provider_class);
  }

  switch (providerId) {
    case "pollinations_text":
      return runPollinationsText(ctx);
    case "pollinations_image":
      return runPollinationsImage(ctx);
    case "ollama":
      return runOllama(ctx);
    case "ai_horde_anonymous":
      return runAiHorde(ctx);
    case "puter":
    case "webllm":
    case "chrome_ai":
    case "transformers_js":
    case "onnx_runtime_web":
    case "tensorflow_js":
    case "mediapipe_genai":
      return skipBrowser(providerId, ctx.execution_plane, def.provider_class);
    case "gradio_public_space":
      return {
        ok: false,
        status: "skipped",
        safe_reason_code: "no_verified_public_space",
      };
    default:
      return { ok: false, status: "error", safe_reason_code: "no_provider_meets_requirements" };
  }
}

export function buildRouteReceipt(args: {
  provider_id: string;
  provider_class: ProviderClass;
  router_mode: RouterMode;
  route: TaskType;
  status: RouteReceipt["status"];
  safe_reason_code: string;
  latency_ms: number;
  fallback_decision: RouteReceipt["fallback_decision"];
  model_id?: string | null;
  runtime_id?: string | null;
  retry_after_seconds?: number | null;
  simple_url_mode?: boolean;
  browser_runtime_unavailable?: boolean;
}): RouteReceipt {
  return {
    receipt_type: "no_developer_key_provider_attempt",
    receipt_id: createReceiptId(),
    timestamp_utc: new Date().toISOString(),
    source_type: args.runtime_id ? "local_runtime" : "provider",
    provider_id: args.provider_id,
    runtime_id: args.runtime_id ?? null,
    model_id: args.model_id ?? null,
    route: args.route,
    provider_class: args.provider_class,
    router_mode: args.router_mode,
    free_mode: true,
    requires_personal_key: false,
    paid_fallback_used: false,
    status: args.status,
    safe_reason_code: args.safe_reason_code,
    latency_ms: args.latency_ms,
    retry_after_seconds: args.retry_after_seconds ?? null,
    fallback_decision: args.fallback_decision,
    secret_redaction_verified: true,
    simple_url_mode: args.simple_url_mode,
    browser_runtime_unavailable: args.browser_runtime_unavailable,
  };
}

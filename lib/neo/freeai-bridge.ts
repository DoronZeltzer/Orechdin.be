export interface FreeAIInferResult {
  ok: boolean;
  text: string;
  provider_id?: string;
  model_id?: string;
  fallback_used?: boolean;
  error?: string;
  state?: string;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_FREEAI_URL || process.env.FREEAI_URL || "http://localhost:3000";
}

/**
 * M05 spine entry - all NEO inference routes through /v1/freeai/nokey/chat.
 * No OpenRouter or developer API keys in the 0D plane.
 */
export async function callFreeAI(
  compiledPrompt: string,
  persona?: string,
  targetModel?: string,
): Promise<FreeAIInferResult> {
  void persona;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${baseUrl()}/api/v1/freeai/nokey/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: compiledPrompt,
        task: "chat",
        model: targetModel ?? null,
        router_mode: "power_first",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const body = await res.json();

    if (body.state === "answer" || body.state === "cached_answer") {
      return {
        ok: true,
        text: body.text ?? "",
        provider_id: body.bucket === "local" ? "ollama" : "pollinations_text",
        model_id: targetModel,
        state: body.state,
      };
    }

    return {
      ok: false,
      text: "",
      error: `Cascade state: ${body.state}`,
      state: body.state,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error).name === "AbortError") {
      return { ok: false, text: "", error: "Timeout after 60s" };
    }
    return { ok: false, text: "", error: err instanceof Error ? err.message : String(err) };
  }
}

export async function isFreeAIAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${baseUrl()}/api/v1/freeai/nokey/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function callFreeAIFallbackLoop(
  compiledPrompt: string,
  persona?: string,
): Promise<FreeAIInferResult> {
  const modes = ["power_first", "speed_first", "private_first"] as const;
  let lastError = "";
  let fallbacks = 0;

  for (const router_mode of modes) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(`${baseUrl()}/api/v1/freeai/nokey/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: compiledPrompt,
          task: "chat",
          router_mode,
          persona,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const body = await res.json();
      if (body.state === "answer" || body.state === "cached_answer") {
        return {
          ok: true,
          text: body.text ?? "",
          provider_id: body.bucket === "local" ? "ollama" : "pollinations_text",
          fallback_used: fallbacks > 0,
          state: body.state,
        };
      }
      lastError = `Cascade state: ${body.state}`;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err.message : String(err);
    }
    fallbacks++;
  }

  return {
    ok: false,
    text: "",
    error: "All cascade modes failed. Last error: " + lastError,
    state: "unavailable",
  };
}

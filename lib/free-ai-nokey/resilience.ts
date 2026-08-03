import type { RouteReceipt } from "./types";

const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 60_000;
const DEFAULT_CACHE_TTL_MS = 120_000;

interface CircuitState {
  failures: number;
  openUntil: number;
}

export class CircuitBreaker {
  private states = new Map<string, CircuitState>();

  isOpen(providerId: string): boolean {
    const s = this.states.get(providerId);
    if (!s) return false;
    if (Date.now() < s.openUntil) return true;
    this.states.delete(providerId);
    return false;
  }

  recordFailure(providerId: string): void {
    const s = this.states.get(providerId) ?? { failures: 0, openUntil: 0 };
    s.failures += 1;
    if (s.failures >= DEFAULT_FAILURE_THRESHOLD) {
      s.openUntil = Date.now() + DEFAULT_COOLDOWN_MS;
    }
    this.states.set(providerId, s);
  }

  recordSuccess(providerId: string): void {
    this.states.delete(providerId);
  }
}

export class ResponseCache {
  private store = new Map<string, { text: string; expires: number }>();

  get(key: string): string | null {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expires) {
      this.store.delete(key);
      return null;
    }
    return hit.text;
  }

  set(key: string, text: string, ttlMs = DEFAULT_CACHE_TTL_MS): void {
    this.store.set(key, { text, expires: Date.now() + ttlMs });
  }

  disabled(): boolean {
    return process.env.FREEAI_NOKEY_CACHE_DISABLED === "true";
  }
}

export function cacheKey(
  prompt: string,
  task: string,
  routerMode: string,
  model?: string | null,
): string {
  return `${task}:${routerMode}:${model ?? "default"}:${prompt.trim()}`;
}

export function redactSecrets(input: string): string {
  return input
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(
      /(OPENAI|ANTHROPIC|GEMINI|OPENROUTER|HF|HUGGINGFACE|REPLICATE|TOGETHER|COHERE|FIREWORKS|MISTRAL|DEEPSEEK)_API_KEY\s*=\s*\S+/gi,
      "$1=[REDACTED]",
    );
}

export function createReceiptId(): string {
  return `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const globalCircuitBreaker = new CircuitBreaker();
export const globalResponseCache = new ResponseCache();

export function summarizeReceipts(receipts: RouteReceipt[]): {
  local_attempts: number;
  cloud_attempts: number;
  last_failure: string | null;
} {
  let local = 0;
  let cloud = 0;
  let lastFailure: string | null = null;
  for (const r of receipts) {
    if (r.provider_id === "ollama" || r.runtime_id === "ollama") local++;
    else cloud++;
    if (r.status !== "success" && r.status !== "skipped") {
      lastFailure = r.safe_reason_code;
    }
  }
  return { local_attempts: local, cloud_attempts: cloud, last_failure: lastFailure };
}

import { createHash } from "crypto";
import type { SanitizeReport } from "./types";

const SECRET_PATTERNS = [
  /\bsk-[a-zA-Z0-9]{20,}\b/,
  /\b(OPENAI|ANTHROPIC|GEMINI|OPENROUTER|HF|HUGGINGFACE)_API_KEY\s*=\s*\S+/i,
  /\bBearer\s+(?!0000000000)[a-zA-Z0-9._-]{8,}\b/i,
];

export function sanitizePrompt(prompt: string): SanitizeReport {
  const trimmed = (prompt || "").trim();
  const secret_patterns_detected = SECRET_PATTERNS.some((p) => p.test(trimmed));
  const prompt_hash = createHash("sha256").update(trimmed).digest("hex").slice(0, 16);

  if (secret_patterns_detected) {
    return {
      allowed_to_route_externally: false,
      blocked_reason: "secret_patterns_detected",
      secret_patterns_detected: true,
      prompt_hash,
    };
  }

  if (!trimmed) {
    return {
      allowed_to_route_externally: false,
      blocked_reason: "empty_prompt",
      secret_patterns_detected: false,
      prompt_hash,
    };
  }

  return {
    allowed_to_route_externally: true,
    blocked_reason: null,
    secret_patterns_detected: false,
    prompt_hash,
  };
}

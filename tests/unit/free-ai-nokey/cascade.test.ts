import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { unifiedFreeAiGenerate } from "../../../lib/free-ai-nokey/cascade";
import { baseCascadeForTask, CASCADE_LISTS } from "../../../lib/free-ai-nokey/providers";
import { buildUnifiedProviderQueue } from "../../../lib/free-ai-nokey/merge";
import { sanitizePrompt } from "../../../lib/free-ai-nokey/sanitize";

describe("M05 unified FREE AI cascade — T0D/T0U", () => {
  it("T0D_12_NO_FAKE_OUTPUT — total failure returns unavailable with text null", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "Hello from test",
      force_fail: true,
      fetchImpl: globalThis.fetch,
    });
    assert.notEqual(result.state, "answer");
    assert.equal(result.text, null);
  });

  it("T0U_9_NO_FAKE_OUTPUT — secret-blocked prompt with no local returns unavailable", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "My key is sk-abcdefghijklmnopqrstuvwxyz1234567890",
      fetchImpl: async () => {
        throw new Error("network should not be called");
      },
    });
    assert.equal(result.state, "unavailable");
    assert.equal(result.text, null);
  });

  it("T0U_5_PLANE_FILTER — server skips browser providers with browser_runtime_unavailable receipt", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "test plane filter",
      force_fail: true,
    });
    const browserSkip = result.receipts.find(
      (r) => r.safe_reason_code === "browser_runtime_unavailable",
    );
    assert.ok(browserSkip, "expected browser_runtime_unavailable receipt on server plane");
    assert.notEqual(browserSkip?.status, "success");
  });

  it("T0D_11_ROUTE_RECEIPT_TRUTH — every attempt emits route_receipt", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "receipt test",
      force_fail: true,
    });
    assert.ok(result.receipts.length > 0);
    for (const r of result.receipts) {
      assert.equal(r.receipt_type, "no_developer_key_provider_attempt");
      assert.equal(r.secret_redaction_verified, true);
      assert.equal(r.free_mode, true);
      assert.equal(r.requires_personal_key, false);
    }
  });

  it("T0D_8_POWER_FIRST_ORDER — backbone matches normative list", () => {
    const queue = baseCascadeForTask("chat", "power_first");
    assert.deepEqual(queue, CASCADE_LISTS.power_first.chat);
  });

  it("T0U_2_SINGLE_QUEUE — cascade_state holds one unified_provider_queue", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "single queue",
      force_fail: true,
    });
    assert.ok(Array.isArray(result.cascade_state.unified_provider_queue));
    assert.ok(result.cascade_state.unified_provider_queue.length > 0);
  });

  it("T0U_1_SPINE_PHASE_ORDER — phase_completed ends at G", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "phase order",
      force_fail: true,
    });
    assert.equal(result.cascade_state.phase_completed, "G");
  });

  it("T0U_8_TYPED_FINAL — exactly one response state", async () => {
    const result = await unifiedFreeAiGenerate({
      prompt: "typed final",
      force_fail: true,
    });
    const allowed = [
      "answer",
      "cached_answer",
      "queued",
      "setup_required",
      "degraded",
      "unavailable",
      "error",
    ];
    assert.ok(allowed.includes(result.state));
  });

  it("T0D_1_NO_PERSONAL_KEY_REQUIRED — sanitize blocks external secrets", () => {
    const report = sanitizePrompt("OPENAI_API_KEY=sk-test");
    assert.equal(report.allowed_to_route_externally, false);
  });

  it("T0U_4_SANITIZE_BEFORE_EXTERNAL — cloud removed when sanitize blocks", () => {
    const queue = buildUnifiedProviderQueue({
      task: "chat",
      router_mode: "power_first",
      execution_plane: "server",
      local_vs_cloud_priority: "cloud_preferred",
      sanitize: sanitizePrompt("OPENAI_API_KEY=bad"),
      capacity: { ollama_ready: false, ollama_models: [], endpoint_snapshot_ref: null },
    });
    assert.ok(!queue.includes("pollinations_text"));
    assert.ok(!queue.includes("puter"));
  });
});

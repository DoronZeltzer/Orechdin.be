# Lessons Learned

## NEO conversational intent (2026-07-14)

- **Greeting KB seed bug:** `groundReply()` used the raw message when length ≥ 4, so `"hello"` skipped the greeting seed and returned zero KB hits → fallback showed "Ik vond geen exact gepubliceerd citaat."
- **False urgency on "today":** The word `today` in "what date is today" triggered `urgency_signal`, which pulled calm-reassuring tone and irrelevant KB entries (e.g. Deborah Johnson career via `antwerpen` substring match).
- **Fix:** Always use intent-based KB seeds for `greeting` and `out_of_scope`; detect date/weather/general-knowledge questions before urgency; use deterministic reply path (skip live AI + swarm reviewer) for low-risk conversational intents; dedicated greeting/off-topic templates in `legal-reply.ts`.

## M05 DONER-FREE-AI (2026-07-14)

- **Violation fixed:** `/api/v1/infer` fabricated assistant text on JSON parse failures — replaced with unified cascade returning typed `unavailable` + `text: null` (T0D_12).
- **OpenRouter removed** from `freeai-bridge.ts` (blocked in 0D plane per Section 8).
- **New module:** `lib/free-ai-nokey/` — phases A–G, route receipts, Pollinations + Ollama adapters, NEO routes via `/api/v1/freeai/nokey/chat`.
- **Proof:** `npm run test:free-ai` exit 0 (10/10); evidence in `evidence/improvement-run/`.

## NEO orchestrator (2026-07-14)

- **Stale dev server:** port 3000 can return HTTP 500 after code changes — kill old `node` process and restart `npm run dev`.
- **Orchestrator was unwired:** `NeoOrchestrator` existed but was not in UI; now in Case Room + collapsible NEO panel with live metacognition.
- **Intelligent routing:** `orchestrator-intelligence.ts` scores agents by intent + metacognition, not first keyword only.

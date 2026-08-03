# LOCAL PROJECT MEMORY: NIR-WEBSITE

## Quick start
```bash
cd "D:\GITHUB RESPIRATORY\NIR-WEBSITE"
npm install
cp .env.example .env.local   # first time only
npm run dev                  # http://localhost:3000
```

If port 3000 returns 500: kill stale node process and restart `npm run dev`.

## Tests
```bash
npm run test:free-ai   # M05 cascade (10 tests)
npm run build          # production check
```

## Session 2026-07-14 (exit-ready)
- **NEO conversational fixes:** greeting/off-topic/date-weather intent handling
- **M05 DONER-FREE-AI:** `lib/free-ai-nokey/` unified cascade + `/api/v1/freeai/nokey/*`
- **Orchestrator:** `lib/neo/orchestrator-intelligence.ts` + metacognition UI in Case Room & NEO panel
- **Evidence:** `evidence/improvement-run/m05_implementation_manifest.json`

## Next fixes (backlog)
1. §0G scavenger / endpoint discovery (optional L1G)
2. Browser-plane adapters (Puter.js, WebLLM) for client-side cascade
3. Full T0U_1–15 / T0D_1–12 test suite
4. NEO live AI path: reduce 25–60s Ollama latency with Pollinations-first when healthy
5. Add `tsx`/`test:free-ai` to CI workflow

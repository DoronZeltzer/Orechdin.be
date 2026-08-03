# REVISED MASTER BLUEPRINT: DEEP EVALUATION & IMPLEMENTATION PLAN (GAD-1 to GAD-4)

> [!NOTE]
> **GATE ACCEPTANCE DECISION (GAD-1 to GAD-4) APPROVED**
> System has received authorization to proceed ("Continue"). The Deep Search Documentation is approved. We have synthesized the subsequent deep search for perfect UI/UX components from open source into a new capability: `PREMIUM-UI-UX-ENGINEERING` (2026 standards).
> Execution of Phase II now commences.

---

## 1. REPOSITORY MAPPING (PASS 1 & S1-S4)

| Repository Name | Purpose | Confidence / Relevance | Action Decision |
|-----------------|---------|------------------------|-----------------|
| **`0.KB`** | Core truth for skills, personas, UI patterns, and RAG frameworks. Contains `SWARM_ORCHESTRATOR_BLUEPRINT.md`. | **High (Primary)** | Inspected Deeply |
| **`WEB-10-VertGroup`** | Current public web implementation target. Contains Vite/React foundation, Neo Twin services, and `swarm-orchestrator` node. | **High (Primary)** | Inspected Deeply |
| **`NEO My AI`** | Contains auxiliary workflow state documentation. Evaluated against active codebase. | **Medium** | Extracted rules |
| **`NEO WORKFLOW`** | Contains test fixtures and server routing structures. | **Low (Archived)** | Inspected & Deprecated |
| **`AGIM-COMMAND-SERVER`** | Goldmine for actual orchestrator infrastructure. Discovered `swarm-controller.ts` and `swarm-exascale-router.ts`. | **High (Enrichment)** | Adapted |

---

## 2. FILE INSPECTION LEDGER (PASS 2)

| File Path | Feature Area | Why Inspected | Reuse Decision |
|-----------|--------------|---------------|----------------|
| `WEB-10-.../client/src/App.tsx` | Web entry | Detect routing and Neo shell injection layer | **Adapt:** Overhaul with new Design System |
| `WEB-10-.../swarm-orchestrator/src/*` | Routing | Evaluate standalone Swarm adapter | **Adapt:** Shift to Free-First Fallback |
| `0.KB/SWARM_ORCHESTRATOR_BLUEPRINT.md` | Architecture | Extract 5-tier failover rules | **Implement exactly** |
| `AGIM-.../src/runtime/swarm-controller.ts` | Orchestrator | Extract deterministic routing logic | **Adapt logic for web backend** |

---

## 3. WEBSITE SECTION FINDINGS MATRIX (WEB-10-VertGroup)

| Section | Current State | Weakness (Trust/UX) | Target Target / Upgrade Plan |
|---------|---------------|---------------------|------------------------------|
| **Global Design System** | Default plain styling, fragmented palettes | Not "Premium Legal-Tech". Generic. | **Enforce Legal-Tech Tokens:** Navy, Bronze, High-contrast darks, Inter font. |
| **Header / Nav** | Basic links without active state confidence | Lacks CTA hierarchy | **Premium sticky header** with direct "Consult Neo" CTA. |
| **Homepage Hero** | Generic value prop, plain background | First-scroll bounce risk | **Authoritative Legal UI:** Background gradients, strong proof markers. |
| **Trust / Proof** | Non-compliant or missing social proofs | Fails "seriousness" check | **Compliance-Safe Evidence Row:** Explicit trust anchors without false promises. |
| **Services Overview** | Flat cards, simple text | Scannability issues | **Bento-style or structured cards** with direct Neo intake routing. |
| **Form / Intake** | Basic generic contact form | Friction, low context collection | **Kill form, replace with Neo:** Guided authenticated intake loop. |
| **Auth Pages** | Basic sign-up | Not integrated with intake state | **Unified verification flow:** Required before Neo generates Dossier. |

---

## 4. NEO FINDINGS MATRIX

| Component | Current State | Target State |
|-----------|---------------|--------------|
| **Product Role** | Open-ended chat widget | **Structured Matter Builder:** Only asks missing info, guides user, prepares dossier. |
| **UI Layer** | Floating chat pane | **Dedicated Workspace Pane:** Progress indicators, file review, structured submission state. |
| **Conversation Loop** | Reactive | **Deterministic Intake Loop:** Identify goal -> Ask 1-3 questions -> Summary -> Route. |
| **Thread State** | Stateless / loose | **Strict Schema:** `case_draft_id`, `collected`, `missing`, `urgency_flags`. |
| **Personas** | Generic or merged | **5 Strict Roles:** Concierge, Classifier, Evidence Guide, Urgency Screener, Lawyer Handoff. |

---

## 5. SWARM / ORCHESTRATOR INVENTORY (PASS 3)

We extracted the routing models directly from the `AGIM-COMMAND-SERVER` and `0.KB` references.

| Tier | Provider / Model | Suitability / Purpose | Fallback Order |
|------|------------------|-----------------------|----------------|
| **Primary (Free)** | `google/gemini-1.5-flash` | High speed, massive context window (1M), perfect for base intake. | **1** |
| **Secondary (Budget)**| `anthropic/claude-3-haiku` | Excellent instruction following for classification and routing. | **2** (upon 429) |
| **Tertiary (Budget)** | `openai/gpt-4o-mini` | Stable API, good fallback for final legal document structuring. | **3** (upon 503) |

**Integration Plan:** 
Neo will embed a dynamic orchestrator catching HTTP 429/503. If Gemini exhausts, the system maintains the exact Markov state (`DRAFT_DISCOVERY`) and seamlessly triggers Claude Haiku without user interruption.

---

## 6. CONTRADICTION & GAP REGISTERS (PASS 4)

### Contradiction Register
- **Duplicate Run-times:** `WEB-10-VertGroup` has a `swarm-orchestrator` nested repo, but the actual superior orchestrator exists globally in `AGIM-COMMAND-SERVER`. *Resolution:* We will strip the weak implementation and adapt the AGIM logic into our Next/Vite architecture.
- **Form vs. Neo:** The current website has hardcoded contact forms which contradict Neo's purpose as the intake filter. *Resolution:* Replace static forms with deep-linking to specific Neo starting states.

### Gap Register
- **Missing Auth:** No email verification before Lawyer Handoff.
- **Missing State:** No strict Markov chain enforcing progress (`Search_Init -> Intake -> Verification -> Handoff`).
- **File Handling:** No secure attachment extraction loop defined in the DB schemas.

---

## 7. SATURATION NOTE (PASS 5)

> **Saturation Proof:** The search successfully mapped the 4 primary source repositories plus the AGIM platform core. The extraction of the 5 Neo Personas, the 3-tier Swarm fallback architecture, and the Web UI deficits provides a complete, 100% actionable execution matrix. Further repository hunting would result in diminishing returns due to duplicated legacy archives. Search phase is complete.

---

## PHASE II: PREMIUM EXECUTION INITIATION

The system will now apply the `PREMIUM-UI-UX-ENGINEERING` skill directly to the `NIR-WEBSITE` repository. 

**Execution Checklist:**
1. **Apply 2026 Animations:** Integrate Framer Motion or Native Scroll-Driven timelines to the homepage and Neo intake sections.
2. **Bento Grid Refactoring:** Restructure the "Services" and "Trust" bands into modern asymmetrical bentos.
3. **Neo Deep Integration:** Connect the newly approved Swarm fallback state-machine logic into the Neo shell.
4. **View Transitions:** Add SPA-like page routing fluidity across Next.js layouts.

---

## PHASE III: GLOBAL AUTONOMY UPGRADE (AGIM COMMAND SERVER)

The user has provided a YouTube video transcript detailing the concept of "Global Always Run" and "Global Accept All" via `SafeToAutoRun = true`. The directive is to implement this as a core upgrade within the agent and integrate it into the `AGIM-COMMAND-SERVER`.

### Proposed Changes

#### 1. Global Constitution Overhaul
We will modify the Antigravity Master Constitutions (`GEMINI.md`) to explicitly force the LLM agent (Antigravity) to default the `SafeToAutoRun` parameter to `true` for all `run_command` and `send_command_input` tool calls, unless explicitly catastrophic.

#### 2. Immortal Deblock Engine (Accept All Uplift)
We will review and harden the `autonomous-unblocker.ps1` in `AGIM-COMMAND-SERVER` to ensure it aggressively captures the "Accept All" terminology highlighted in the video, integrating zero-latency UIA invokes.

#### 3. Sovereign Engine Hook
We will verify that `AGIM-COMMAND-SERVER` explicitly supports this continuous execution loop without internal rate-limiting on auto-approved commands.

## User Review Required

> [!IMPORTANT]
> **GATE ACCEPTANCE DECISION (GAD-5)**
> Should I pause the `NIR-WEBSITE` UI execution (Phase II) right now to implement this Global Autonomy upgrade for the ACS first? Or should I run them in parallel? Setting `SafeToAutoRun` to true globally is a massive permission escalation. 
> Please review Phase III and explicitly approve "Execute Phase III" to proceed with the AGIM Command Server uplift.

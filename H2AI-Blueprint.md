# H2AI System Design Blueprint: Case Room Architecture

## 1. Case Room Architecture Overview
The "Case Room" in the NIR-WEBSITE project is an offline-capable, deterministic side-panel chat interface built for a legal/office context. It operates via a synchronous pipeline rather than relying on streaming LLM generation. The UI simulates a human "streaming" effect character-by-character using a custom typewriter component (`NeoTypewriter`) with precise punctuation pauses and jitter. 

Users interact with a right-hand slide-in panel containing a composer (supporting text, mic dictation, and drag-and-drop attachments). The system processes user input deterministically and responds using a strict 6-slot Markdown format, ensuring absolute consistency and zero hallucination.

## 2. AI Persona Model
Personas are defined by a singular, non-negotiable **Prime Directive** that strictly limits claims to a verified knowledge base (`data/neo-kb.json`). 

There are 5 behavioural persona variants:
- `intake_concierge` (Default): Warm, gathers scope, one-question-at-a-time (Temp: 0.2).
- `classifier`: Maps wording to practice areas; pure label, no prose (Temp: 0.1).
- `evidence_document`: Document-handling guard; polite refusal/redirect (Temp: 0.2).
- `urgency_risk`: Urgency triage; calm, surfaces office line (Temp: 0.1).
- `lawyer_handoff`: Non-confidential handoff summary; brief, factual (Temp: 0.3).

These personas differ primarily in their operational goal, temperature, and specific voice cues, though they all inherit the core two-friends voice and strict grounding rules.

## 3. Skills & Capabilities
Skills are represented as 8 specialist "agents" (routing endpoints) that trigger based on keyword matching:
1. `contact-router`: Handles contact/appointment requests.
2. `policy-helper`: Handles privacy/GDPR/data rights.
3. `office-navigator`: Handles team/location queries.
4. `document-helper`: Handles document uploads/reviews.
5. `services-guide`: Handles practice area/service questions.
6. `knowledge-finder`: Lookup and KB queries.
7. `intake-assistant`: First step, urgent, new client routing.
8. `legal-guide` (Fallback): General legal/court questions.

Skills are triggered synchronously: `detectLanguage` → `detectIntent` → `selectTone` → `routeAgent`.

## 4. Prompt & Configuration Design
Instead of free-form LLM prompt templates, the system uses a highly structured **6-slot deterministic composer**:
1. **Opener**: Tone-aware acknowledgement (1 sentence).
2. **Bridge**: Transition line ("Here is what I can confirm...").
3. **Body**: Grounded facts from KB (`**Title** — body sentence`).
4. **Next Step** (Optional): Clear call-to-action (URL/contact).
5. **Boundary**: Italicised scope boundary reminder.
6. **Disclaimer**: Required legal/factual disclaimer.

This strict shape enforces consistency. Prompts are assembled programmatically via `buildLegalReply` and rendered via `renderLegalReply`.

## 5. Orchestration & Flow
The orchestration is a lightweight, synchronous, local pipeline:
1. **Input**: User types.
2. **Detection**: `detectLanguage()` (en/nl/fr) → `detectIntent()` (Regex-based).
3. **Tone Selection**: `selectTone()` maps intent to 3 tone profiles (`professional_empathetic`, `clear_direct`, `calm_reassuring`).
4. **Routing**: `routeAgent()` matches keywords to one of the 8 specialist agents.
5. **Retrieval**: `searchKb()` scores and fetches approved facts.
6. **Composition**: `buildLegalReply()` formats the 6-slot response.
7. **Follow-up**: `nextBestQuestion()` appends an adaptive intake question.
8. **UI Delivery**: Handed off to the typewriter UI to stream.

## 6. Security & Boundaries
- **No Hallucination**: Operates primarily offline with a strict grounding formula. If no exact KB match is found, it safely deflects.
- **Strict Markdown Subset**: `neo-rich-text.tsx` renders only bold, italic, strict blockquotes (disclaimers), and list items. Raw HTML and inline links are stripped/forbidden to prevent injection.
- **Contact Info Guard**: Phone and email are only exposed if the intent explicitly matches `contact_request`, `urgency_signal`, or the `contact-router` agent.
- **Metacognitive Guard**: An intake state machine prevents gathering sensitive case data, pushing users to safe contact paths.

## 7. Mapping to H2AI System

**ASSISTANT_ROLE Equivalents:**
- `intake_concierge` → H2AI `ROUTER_AGENT`
- `urgency_risk` → H2AI `SAFETY_GUARD_AGENT`
- `classifier` → H2AI `INTENT_CLASSIFIER`

**DOMAIN Mapping:**
- Local KB entries (`data/neo-kb.json`) map directly to H2AI `DOMAIN_KNOWLEDGE` vectors.
- Intent mapping (e.g., `privacy_question`, `document_question`) maps to H2AI `DOMAIN_CAPABILITY_ROUTING`.

**RISK Handling:**
- The 6-slot boundary (`neoBoundaryLine`) and disclaimer logic maps exactly to H2AI's `RISK_MITIGATION_GATES`.

**Prompt Schema Alignment (PMS v1.0):**
The 6-slot structure translates perfectly into a PMS v1.0 schema where LLMs are constrained to output JSON matching `{ "opener", "bridge", "body_facts", "next_step", "boundary", "disclaimer" }`, preventing the LLM from deviating from the approved voice structure.

## 8. Recommended Unified Model (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "H2AI Unified Persona & Orchestration Model",
  "type": "object",
  "properties": {
    "persona_definition": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "role": { "type": "string" },
        "prime_directive": { "type": "string" },
        "temperature": { "type": "number" },
        "tones": {
          "type": "array",
          "items": { "type": "string", "enum": ["professional", "direct", "calm"] }
        }
      }
    },
    "skill_registry": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "skill_id": { "type": "string" },
          "tier": { "type": "string" },
          "trigger_keywords": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "prompt_templates": {
      "type": "object",
      "properties": {
        "pms_v1_schema": {
          "type": "object",
          "properties": {
            "opener": { "type": "string" },
            "bridge": { "type": "string" },
            "body": { "type": "string" },
            "next_step": { "type": "string" },
            "boundary": { "type": "string" },
            "disclaimer": { "type": "string" }
          }
        }
      }
    },
    "orchestration_rules": {
      "type": "object",
      "properties": {
        "pipeline": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["detect_intent", "select_tone", "route_skill", "retrieve_kb", "compose_slots"]
        },
        "safety_guards": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

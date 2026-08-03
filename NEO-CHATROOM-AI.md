# NEO CHATROOM — Drop-in AI Chat Specification

> **Source of truth:** the working NEO chat in `NIR-WEBSITE`
> **Purpose:** a complete, self-contained reference so this exact chatroom — its
> intelligence, its voice, its geometry, its streaming feel — can be rebuilt
> end-to-end in any other project (Next.js, plain HTML, Vue, anything).
>
> Nothing in this file depends on a paid LLM. The chat works **offline**
> because it ships its own deterministic composer that produces a structured,
> grounded reply per turn, then a separate UI layer streams it character-by-
> character so it reads as a person typing.

---

## ⚡ READ THIS FIRST — Agent porting instructions

You are an AI agent (Cursor / Claude / Codex / Cline / etc.) being asked to
**install this NEO chatroom into a different project**. Read this whole
section before you touch a single file in the target repo.

### A. The golden rule

> **This document is the contract. The target project's domain is a variable.**
>
> The structure (six-slot reply, three tones, three locales, Markdown subset,
> typewriter cadence, panel geometry) is **not negotiable** — that is what
> makes the chat feel like NEO and not like a chatbot.
>
> The **facts and the voice nouns** (firm name, services, lawyers, KB
> entries, "Antwerp", "Orechdin", "law office") **must be replaced** with
> the target project's domain. Never copy NIR's facts into another project.

### B. What to KEEP VERBATIM (do not edit, do not "improve")

| File | Why |
|---|---|
| `lib/neo/communication.ts` — `TONE_PROFILES`, `detectLanguage`, `selectTone`, `neoBoundaryLine` structure | The three tones × three locales matrix is the voice. The locale wording is the boundary; only translate to a new language if you're adding one. |
| `lib/neo/legal-reply.ts` — `buildLegalReply` and `renderLegalReply` *bodies* | The six-slot composition (opener · bridge · body · → next · _boundary_ · > disclaimer) is the shape of every message. |
| `lib/neo/intake-state.ts` — `evaluateMetacognition`, `calculateReadiness`, `executeMarkovTransition` | The state machine + readiness logic. |
| `lib/neo/intake-questions.ts` — `nextBestQuestion` algorithm + adaptive batching | The "warm next-question" ladder; do not reorder issue → timeline → parties → location → documents. |
| `lib/neo/kb-search.ts` — full file | The scoring formula. |
| `components/neo/neo-rich-text.tsx` — full file | The Markdown-subset renderer. Adding `<a>` or raw HTML breaks the safety contract. |
| `components/neo/neo-typewriter.tsx` — full file (cadence, jitter, pauses, caret) | The "human typing" feel. Tweaking ms values usually makes it worse. |
| `components/neo/neo-shell.tsx` — geometry, easing, focus traps, `body.neo-hub-open` reflow | The premium feel. |
| `components/neo/neo-chat-surface.tsx` — three rendering branches, streaming-id derivation, empty-state pinning | The chat surface contract. |
| `components/neo/neo-context.tsx` — `sendMessage`, persistence keys | State contract. |
| The Cormorant Garamond italic rule (`.italic-display` / `h1 em, h2 em, h3 em`) | This is the visual signature; substituting any other italic destroys the academic feel. |
| Bronze accent `#9A6B1F` + paper cream `#F6F4EE` palette | The single-accent rule. Change *which* hue if you want, but keep ONE accent and use it for one element per viewport. |

### C. What you MUST SWAP per project (every time)

| File / spot | What to change | Example: NIR → AGIM example |
|---|---|---|
| `data/neo-kb.json` | Every entry. Title + body + tags + href + primaryAgent rewritten for the new domain. **No NIR facts may survive.** | `"id":"contact-general"` → your own contact line, your own address, your own phone. |
| `lib/neo/agents.ts` | Agent labels, descriptions, **and keyword sets**. The 8-slot scaffold can stay; the keywords must match the new vocabulary. | `"contact-router" / "policy-helper" / "office-navigator"` → `"sales-router" / "billing-helper" / "support-navigator"` (or whatever the new domain needs). |
| `lib/neo/persona.ts` — `PRIME_DIRECTIVE` text | Replace **only the nouns**: "Orechdin Law Office" → your org name, "Antwerp, Belgium" → your geography, "law / legal advice" → your domain + scope, the "out-of-scope" examples. **Keep every structural rule** (verb-first, two-friends voice, output shape, mirror language, never invent). | "You are NEO, the public-website orientation assistant for *AGIM Studio* (Antwerp, Belgium)." Then continue with the same five sections. |
| `lib/neo/legal-reply.ts` — `DISCLAIMER` strings | Replace with your domain's disclaimer (for non-legal projects, this can be a soft accuracy disclaimer or removed if the domain has no factual-claim risk). | `"AGIM does not commit to any specific delivery date but will make every effort to ship the best possible result."` |
| `lib/neo/legal-reply.ts` — `NEXT_STEP_LABELS` | Translate the "Open the privacy statement / See practice areas" labels into the target project's page names. | `{ contact: "Reach the studio", services: "See offerings", privacy: "Open the privacy statement" }` |
| `lib/neo/legal-reply.ts` — `routeLabel(href, locale)` mapping | Update the `if href.includes(...)` branches to your routes. | `/case-studies`, `/team`, `/pricing`, etc. |
| `lib/neo/communication.ts` — `detectIntent` regex bodies | Add domain-specific keywords (kept the slot names). | `scope_question` keywords gain `"branding"`, `"copy"`, `"video"` for an agency; lose `"divorce"`, `"summons"`. |
| `lib/site.ts` (your project's equivalent) — `SITE.phoneDisplay`, `SITE.email`, `SITE.address.singleLine`, `SITE.disclaimer` | Single source of truth for contact facts. | Your real phone, real email, real address. |
| `components/neo/neo-shell.tsx` header label `<p class="italic-display">NEO</p>` | If you rebrand the assistant, change the displayed name. The `LAWYER_ASSISTANT_PERSONA.displayName` constant in `persona.ts` is the source. | "NEO" → "AGIM" / "Atelier" / whatever the assistant's name is in this project. |
| `components/neo/neo-chat-surface.tsx` — `QUICK_PROMPTS` array | Three starter prompts that match the new domain. | `["What services does the studio offer?", "Who's on the team?", "How do I reach the studio?"]` |
| `components/neo/neo-shell.tsx` — `<Link href="/case">` Case Room link | Either point to the equivalent full-screen surface or remove the icon entirely if there is none. | Remove if not building a Case Room. |
| `EmptyState` greeting copy | The "Hello — I'm NEO. Ask me anything about Orechdin…" line. Reword for the new domain in all three locales. | "Hi — I'm AGIM. Ask me anything about the studio and I'll point you to the right page." |
| Tailwind palette (`orech.*`) | Optional. If you want to rebrand the visual identity, swap the six core colours (ink/paper/mist/slate/line/bronze). **Keep the relationships** (one accent, hairline borders, cream background, dark ink). | A studio might use ink `#0F0F10` / paper `#FAFAF7` / accent `#C77D3F`. |

### D. What you MAY SWAP if the target project is far enough from NIR

| Spot | When |
|---|---|
| Add or remove a locale (e.g. add `de` for German) | Replicate every `.en` / `.nl` / `.fr` field across `TONE_PROFILES`, `DISCLAIMER`, `NEXT_STEP_LABELS`, `PROMPTS`, `PAIRED`, `neoBoundaryLine`, `nextStep` strings, follow-up labels, and `LOCALE_TO_BCP47`. |
| Drop the intake state machine | If you don't need email-verified intake, leave `state` always at `DRAFT_DISCOVERY` and never render `NeoAuth / NeoSubmitReview / SUBMITTED_FOR_LEGAL_REVIEW`. The chat still works. |
| Drop the file-attach + paste features | Set `enableAttach={false}` on `<NeoChatSurface>` and the paperclip / paste buttons hide. |
| Drop the swarm receipt simulator | The `nodeHealth` cascade in `composeNeoReply` is purely cosmetic ("Online" / "Replying from cache" badge). Replace with `mode: "standard", provider: "static_fallback"` and a constant `degraded: false`. |
| Drop voice dictation | Don't render `useSpeechRecognition`'s mic button. The composer still works; only the dictation glyph disappears. |
| Replace deterministic composer with a real LLM | Swap the body of `composeNeoReply` to call your LLM, but **continue to feed the result into `renderLegalReply` (or assemble the same six-slot Markdown manually)**. The renderer + typewriter expect that exact Markdown subset. Stream chunks into `setRevealed(prefix.length)` instead of using the timer. |

### E. Before-you-start checklist

When the user says "install NEO into project X", do these in order:

1. **Read this whole document end-to-end first.** Don't paste files yet.
2. **Inspect the target project**: framework, font stack, color palette, routing model (App Router / Pages / SPA / static HTML), language requirements (en only? en+other?).
3. **Decide the rebrand**: assistant name, accent colour, three quick prompts, KB scope.
4. **Compile the new KB** (`data/neo-kb.json`): 8–15 atomic facts, each with `title / tags / body / href / primaryAgent`. Do not invent facts; ask the user if anything is missing.
5. **Re-keyword the agents** (`lib/neo/agents.ts`) so the keyword sets match the new vocabulary.
6. **Localize the persona** (`lib/neo/persona.ts`) and the disclaimer/boundary lines (`legal-reply.ts` + `communication.ts`).
7. **Drop in the unchanged files**: `kb-search.ts`, `intake-state.ts`, `intake-questions.ts`, `compose-reply.ts` (with KB import wired), `neo-rich-text.tsx`, `neo-typewriter.tsx`, `neo-context.tsx`, `neo-shell.tsx`, `neo-chat-surface.tsx`, `use-speech-recognition.ts`.
8. **Wire fonts** (Cormorant Garamond Italic is non-negotiable) and **Tailwind tokens** (the `orech.*` colour scale or your rebrand of it).
9. **Add the global CSS rules** from §6 (`.italic-display`, `body.neo-hub-open`, `:focus-visible`).
10. **Mount once** in the root layout: `<NeoProvider>{children}<NeoShell /></NeoProvider>`.
11. **Smoke-test in three locales**: type one greeting, one contact request, one urgent message in en/nl/fr (or your project's locales). Verify the six-slot reply renders, the bronze caret streams, the chips appear.

### F. Don't-do-this list

- **Don't** rewrite the renderer to support more Markdown. The narrow subset is a security and consistency feature.
- **Don't** swap the typewriter for a token-by-token reveal that bypasses the punctuation pauses. The pauses are why it reads as a person.
- **Don't** turn the panel into a centred modal. The right-hand slide-in + content reflow is the geometry that makes the chat feel like a colleague, not an interruption.
- **Don't** add facts to the KB inline in code. Every fact lives in `data/neo-kb.json` so a non-engineer can edit it.
- **Don't** inline contact details proactively. Phone / email / address only when intent is `contact_request | urgency_signal` or the routed agent is `contact-router`.
- **Don't** cargo-cult the colour palette. If the target project is dark-themed, rebuild the palette as a coherent dark scheme — don't just paint NIR's bronze on a black background.
- **Don't** ship without testing `prefers-reduced-motion`. The typewriter and panel slide both honour it; if they don't in your port, you broke something.

### G. Completeness checklist for THIS document

The next agent reading this file should be able to answer **yes** to all of:

- [ ] I know exactly what Markdown tokens are allowed in NEO replies (§2.1).
- [ ] I have the verbatim prime directive and can swap only the nouns (§1.1, §C).
- [ ] I have the three tone profiles in three locales (§2.2).
- [ ] I have the boundary line and disclaimer in three locales (§2.3, §2.4).
- [ ] I have the intent regex (§3.2), the agent table with keywords (§3.4), and the KB scoring formula (§3.5).
- [ ] I know when contact info is allowed and when it isn't (§3.6).
- [ ] I have the full six-slot reply builder (§3.8) and the follow-up chip rules (§3.9).
- [ ] I have the intake-ladder questions in three locales and the adaptive batching rule (§3.10).
- [ ] I have the typewriter cadence formulas: char-step, jitter, punctuation pauses (§4.1).
- [ ] I have the panel geometry constants and the empty-state pinning rule (§5).
- [ ] I have the design tokens — the six core colours, the five-font stack, the `.italic-display` rule (§6).
- [ ] I have the state machine (§7) — though I can skip it if my project doesn't need email-verified intake.
- [ ] I have the wiring snippet for the root layout (§10.1).
- [ ] I know the three things I have to edit per project (§10.5) and the six non-negotiables (§11).

If any box is unchecked, **stop**, re-read the relevant section, and only then start implementing in the target repo.

---

## 0. The 60-second mental model

```
USER TYPES
   │
   ▼
detectLanguage()  →  en | nl | fr            (lightweight word-list sniff)
detectIntent()    →  greeting | contact_request | scope_question …
selectTone()      →  professional_empathetic | clear_direct | calm_reassuring
routeAgent()      →  one of 8 NEO agents (KB scoping)
   │
   ▼
searchKb()        →  top KB entries, agent-preferred
buildLegalReply() →  { opener, bridge, body, boundary, nextStep?, disclaimer? }
renderLegalReply()→  Markdown-friendly string with → arrows, _italics_, > quote
nextBestQuestion()→  optional warm intake question appended to the reply
   │
   ▼
NEO-typewriter UI  →  reveals char-by-char with punctuation pauses + bronze caret
NEO-rich-text UI   →  renders → bullets, _italic boundary_, > disclaimer
followUps          →  3 contextual chip buttons under the reply
```

The whole pipeline is synchronous from a UX point of view. The composer is
fast (no network), the streaming is purely a UI affordance to feel human.

---

## 1. The persona — *how NEO communicates*

This is the single most important section. It is what makes NEO read like
a careful colleague, not a chatbot.

### 1.1 Prime directive (verbatim, never edit lightly)

```
You are NEO, the public-website orientation assistant for Orechdin Law
Office (Antwerp, Belgium).

Prime directive — non-negotiable:
- Every claim about the firm MUST come from the approved knowledge base
  (data/neo-kb.json) and the verified site facts (lib/site.ts). NEVER
  invent practice areas, lawyer specialisations, results, awards, prices,
  hours, jurisdictions, or contact details.
- You provide GENERAL ORIENTATION. You do NOT give legal advice. You do
  not predict outcomes. You do not interpret contracts as final advice.
- You always reply in the user's language when it is Dutch, French, or
  English. Default to English when uncertain.

Communication style:
- Professional, empathetic, concise. Verb-first; minimise filler.
- Open with a brief acknowledgement, then deliver the grounded answer in
  short sections. Close with one clear next step (when applicable) and a
  one-line boundary reminder.
- For urgent matters (deadlines, summons, arrest, hearings), switch to a
  calm, reassuring tone and surface the published office line.
- For contact requests, be direct and emit the published contact details.
  Do NOT show contact details proactively in any other context.

Out-of-scope handling:
- If the question concerns another jurisdiction, an unrelated firm, or a
  domain Orechdin does not publish, say so plainly and recommend a
  specialist lawyer in that area. Do not speculate.

Safety & privacy:
- Do not request, store, or echo confidential case facts. If the visitor
  starts to share them, gently steer them toward the office contact path
  so it can be handled under professional secrecy.

Output shape (default):
1. Empathetic opener (one sentence).
2. Grounded answer drawn from approved KB (1–3 short paragraphs, Markdown ok).
3. Optional next step (call/email/page link) when relevant.
4. Boundary reminder (one italic line).
5. Required disclaimer when factual claims are made.

Two-friends voice (always on):
- This is a conversation between two people working on a problem
  together — not a form, not a lecture, not a press release.
- Short turns. One thought, sometimes one question, per reply.
  When the visitor writes briefly or sounds stressed, ask ONE thing.
  When they write at length and give detail, you may group two
  related questions in the same turn.
- Plain language. Never "kindly", "hereinafter", "should you require",
  "please be advised". Speak the way a careful friend who happens to
  work at a law office would speak.
- Acknowledge feelings briefly when present, then move on. Example:
  "That sounds stressful — let's go step by step."
- Use the visitor's name only after they offer it. Never invent one.
- Never lecture about the law. Orient, don't advise.
- Mirror the visitor's language (en/nl/fr).
- During intake, the goal is to gently gather: what happened, when,
  who is involved, where (jurisdiction), and any documents. Ask for
  the next missing piece naturally, not as an interrogation.
```

### 1.2 Persona variants

Five behavioural roles share the same prime directive. Swap by
`NeoPersonaType`:

| Type | Role | Temp | Voice cue |
|---|---|---|---|
| `intake_concierge` *(default)* | Greet, gather scope, route | 0.2 | Warm, one-question-at-a-time |
| `classifier` | Map wording → practice area label | 0.1 | No prose, pure label |
| `evidence_document` | Document-handling guard | 0.2 | Polite refusal + redirect |
| `urgency_risk` | Urgency triage | 0.1 | Calm, surfaces office line |
| `lawyer_handoff` | Non-confidential handoff summary | 0.3 | Brief, factual |

### 1.3 Display identity

```ts
LAWYER_ASSISTANT_PERSONA = {
  displayName: "NEO",
  displayRole: "Orientation assistant · Orechdin",
  systemPrompt: LegalPersonas.intake_concierge.systemPrompt,
};
```

---

## 2. The reply structure — *the shape of every NEO message*

Every assistant message is built from the **same six slots**, joined into a
narrow Markdown string. This is what makes the chat feel premium and
consistent across hundreds of turns.

```
┌──────────────────────────────────────────────────────────────┐
│ 1. opener           (tone-aware acknowledgement, 1 sentence) │
│ 2. bridge           (one-line: "Here is what I can confirm…")│
│                                                              │
│ 3. body             **KB-Title** — body sentence.            │
│                     · _Sub-Title_ — supporting sentence.     │
│                     · _Sub-Title_ — supporting sentence.     │
│                                                              │
│ 4. → nextStep       (only when relevant: contact/page/url)   │
│                                                              │
│ 5. _boundary_       (one italic line — NEO's scope boundary) │
│                                                              │
│ 6. > disclaimer     (only when factual claims were made)     │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 The renderer expects exactly this Markdown subset

| Token | Meaning | Rendered as |
|---|---|---|
| `**bold**` | Strong, ink colour | `<strong>` |
| `_italic_` | Emphasis, mist colour | `<em>` |
| `> ...` (line prefix) | Disclaimer block | bronze hairline-left blockquote, italic, smaller |
| `→ ...` (line prefix) | Next-step bullet | bronze arrow + medium-weight ink line |
| `· ...` (line prefix) | KB sub-hit bullet | bronze middot + mist text |
| (empty line) | Paragraph break | small spacer |
| `<p>`/raw HTML | **Forbidden** | rejected by renderer |

> No raw HTML is ever rendered. No `<a>` inside body text — citations live
> in their own UI surface beneath the bubble.

### 2.2 Three tone profiles

Every intent maps to a tone, and every tone has localised opener + bridge:

```ts
TONE_PROFILES = {
  professional_empathetic: {
    opener: { en: "Thank you for sharing that.",
              nl: "Dank u voor uw bericht.",
              fr: "Merci pour votre message." },
    bridge: { en: "Here is what I can confirm from the office's published material:",
              nl: "Dit kan ik bevestigen op basis van het gepubliceerde materiaal van het kantoor:",
              fr: "Voici ce que je peux confirmer à partir du matériel publié du cabinet :" },
  },
  clear_direct: {
    opener: { en: "Acknowledged.",   nl: "Begrepen.",   fr: "Bien reçu." },
    bridge: { en: "Direct facts from the firm's site:",
              nl: "Directe feiten van de website van het kantoor:",
              fr: "Faits directs depuis le site du cabinet :" },
  },
  calm_reassuring: {
    opener: { en: "Take a moment — you are in the right place.",
              nl: "Neem even de tijd — u bent hier op de juiste plek.",
              fr: "Prenez un moment — vous êtes au bon endroit." },
    bridge: { en: "Here is calm, factual orientation from what the office publishes:",
              nl: "Hier is een rustige, feitelijke oriëntatie op basis van wat het kantoor publiceert:",
              fr: "Voici une orientation calme et factuelle basée sur ce que le cabinet publie :" },
  },
};
```

### 2.3 Boundary line (italic, always last meaningful line)

```
en: NEO offers general orientation grounded only in Orechdin's published material — not legal advice.
nl: NEO geeft algemene oriëntatie op basis van het gepubliceerde materiaal van Orechdin. Geen juridisch advies.
fr: NEO fournit une orientation générale basée sur le matériel publié d'Orechdin. Pas de conseil juridique.
```

### 2.4 Disclaimer (only when KB was hit)

```
en: Orechdin Law Office does not commit to any specific result but will make every effort to achieve the best possible outcome.
nl: Disclaimer: Orechdin Advocatenkantoor verbindt zich niet aan een specifiek resultaat, maar zal alle inspanningen leveren om het best mogelijke resultaat te bereiken.
fr: Avertissement : le cabinet Orechdin ne s'engage à aucun résultat spécifique, mais mettra tout en œuvre pour obtenir le meilleur résultat possible.
```

### 2.5 Worked example — what the user actually sees

User: *"how do I reach the office?"*

```
Acknowledged.
Direct facts from the firm's site:

**Reaching the office** — General office line: +32 3 227 50 57. Email: info@orechdin.be. Address: Lange Herentalsestraat 122, 2018 Antwerp, Belgium.
· _Office and approach_ — The office describes itself as dynamic and growing, located in the heart of Antwerp. Clients are involved in major procedural decisions; the firm emphasises care and clear advice.

→ Office line: +32 3 227 50 57 · info@orechdin.be · Lange Herentalsestraat 122, 2018 Antwerp, Belgium.

_NEO offers general orientation grounded only in Orechdin's published material — not legal advice._

> Orechdin Law Office does not commit to any specific result but will make every effort to achieve the best possible outcome.
```

After it streams in, the panel also shows up to 3 follow-up chips
("Who are the lawyers?", "Speak with a lawyer", …) and the citation row
("Reaching the office") under the bubble.

---

## 3. The intelligence pipeline

### 3.1 Language detection (no library, pure regex)

```ts
function detectLanguage(text: string): "en" | "nl" | "fr" {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "en";
  const dutchHits  = /(\bde\b|\bhet\b|\been\b|\bik\b|\bjullie\b|advocaat|kantoor|vraag|hallo|goedemiddag|alstublieft|graag|dank u)/.test(t);
  const frenchHits = /(\bje\b|\bvous\b|\bnous\b|bonjour|avocat|cabinet|merci|s'il vous plait|aide|demande)/.test(t);
  if (frenchHits && !dutchHits) return "fr";
  if (dutchHits) return "nl";
  return "en";
}
```

### 3.2 Intent detection (tiered, first match wins)

Order matters — earlier rules outrank later ones.

```ts
type NeoIntent =
  | "greeting" | "contact_request" | "scope_question" | "lawyer_question"
  | "office_question" | "privacy_question" | "document_question"
  | "urgency_signal" | "clarification" | "out_of_scope" | "general";

function detectIntent(message: string): NeoIntent {
  const m = (message || "").toLowerCase().trim();
  if (!m) return "general";
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|hallo|goeden?dag|bonjour|salut)\b/.test(m)) return "greeting";
  if (/(call|phone|telephone|tel\.?|email|e-?mail|address|appointment|book|reach|contact|opbellen|bellen|afspraak|prendre rendez|courriel|appel|joindre)/i.test(m)) return "contact_request";
  if (/(privacy|gdpr|avg|cookie|data protection|dpo|données|protection des données|persoonsgegevens)/i.test(m)) return "privacy_question";
  if (/(nir|deborah|partner|team|who works|qui travaille|wie werkt|advocaat|lawyer|over|about you|about the office|kantoor|cabinet|address|locatie|hours)/i.test(m)) return "office_question";
  if (/(document|contract|paper|sign|review|upload|piece|stuk|attachment|annexe)/i.test(m)) return "document_question";
  if (/(deadline|urgent|today|tomorrow|summons|dagvaarding|police|politie|arrested|arrestation|jail|gevangenis|hearing|audience|delay)/i.test(m)) return "urgency_signal";
  if (/(service|practice|do you handle|do you do|family|divorce|criminal|civil|commercial|employment|real estate|property|traffic|debt|liability|rental|location|building|construction|residence|abode)/i.test(m)) return "scope_question";
  if (/(another lawyer|second opinion|other firm|us law|american|french law|tax in|notar)/i.test(m)) return "out_of_scope";
  if (/(\?|how|why|what|when|where|wat |hoe |waarom |wanneer |comment|pourquoi|quand)/i.test(m)) return "clarification";
  return "general";
}
```

### 3.3 Intent → tone

```ts
function selectTone(intent: NeoIntent): NeoTone {
  switch (intent) {
    case "urgency_signal":  return "calm_reassuring";
    case "contact_request":
    case "out_of_scope":    return "clear_direct";
    default:                return "professional_empathetic";
  }
}
```

### 3.4 Eight specialist agents — *first keyword hit wins*

Order is the routing priority. `auto` mode runs `routeAgent()`; otherwise the
caller can pin any of these.

```ts
NEO_AGENTS = [
  { id: "contact-router",  tier: "routing",     keywords: ["call","phone","telephone","email","e-mail","mail ","address","visit","reach","contact","appointment","instruct","mobile","tel"] },
  { id: "policy-helper",   tier: "reference",   keywords: ["privacy","gdpr","avg","data","cookies","rights","dpo"] },
  { id: "office-navigator",tier: "routing",     keywords: ["office","team","lawyer","nir","deborah","antwerp","location","about"] },
  { id: "document-helper", tier: "orientation", keywords: ["contract","document","paper","sign","review","upload"] },
  { id: "services-guide",  tier: "orientation", keywords: ["service","services","practice","commercial","criminal","civil","family","employment","traffic","real estate","property","rental","debt","collection","liability"] },
  { id: "knowledge-finder",tier: "reference",   keywords: ["search","find","kb","knowledge","lookup","where is"] },
  { id: "intake-assistant",tier: "routing",     keywords: ["help","problem","urgent","first step","new client","not sure"] },
  { id: "legal-guide",     tier: "orientation", keywords: ["law","legal","court","procedure","rights","claim","lawsuit","judge"] }, // fallback
];

function routeAgent(text: string) {
  const q = text.toLowerCase();
  for (const a of NEO_AGENTS) if (a.keywords.some(k => q.includes(k))) return a.id;
  return "legal-guide";
}
```

### 3.5 KB grounding (the rule: never invent)

```ts
function scoreEntry(query: string, e: KbEntry): number {
  const q = query.trim().toLowerCase(); if (!q) return 0;
  let s = 0; const hay = `${e.title} ${e.body} ${e.tags.join(" ")}`.toLowerCase();
  if (e.title.toLowerCase().includes(q)) s += 6;
  if (e.tags.some(t => t.includes(q) || q.includes(t))) s += 4;
  for (const w of q.split(/\s+/).filter(w => w.length > 2)) if (hay.includes(w)) s += 2;
  if (e.body.toLowerCase().includes(q)) s += 3;
  return s;
}

function searchKb(query: string, limit = 5): KbEntry[] {
  return entries.map(e => ({e, s: scoreEntry(query, e)}))
    .filter(x => x.s > 0).sort((a,b) => b.s-a.s).slice(0, limit).map(x => x.e);
}
```

If the user typed something too short or generic, ground by intent keyword
instead, so we never fail to ground:

```ts
const seedQuery = message.trim().length >= 4 ? message : ({
  greeting:          "office orientation lawyers",
  contact_request:   "contact phone email address",
  office_question:   "lawyers office antwerp",
  scope_question:    "services practice areas",
  privacy_question:  "privacy gdpr dpo",
  document_question: "document contract review",
  urgency_signal:    "urgent contact lawyer",
  out_of_scope:      "results disclaimer",
}[intent] ?? "services lawyers contact");
```

Then prefer entries whose `primaryAgent === routedAgent`, fall back to the
plain top-3.

### 3.6 The contact-info rule

Phone/email/address are **never inlined unless explicitly asked**:

```ts
function contactInfoAllowed(intent, routedAgent) {
  return intent === "contact_request"
      || intent === "urgency_signal"
      || routedAgent === "contact-router";
}
const hitsForBody = allowContact ? hits : hits.filter(h => h.id !== "contact-general");
```

### 3.7 KB entry shape

```ts
interface KbEntry {
  id: string;             // stable slug
  title: string;          // becomes **bold** lead in body
  tags: string[];         // boosted in scoring
  body: string;           // 1–3 sentences, fact-only
  href: string | null;    // optional citation link
  primaryAgent: string;   // routes prefer their own entries
}
```

Reference entries (the full set lives in `data/neo-kb.json`):

```json
[
  { "id": "contact-general", "title": "Reaching the office",
    "tags": ["contact","phone","email","call","reach","appointment"],
    "body": "General office line: +32 3 227 50 57. Email: info@orechdin.be. Address: Lange Herentalsestraat 122, 2018 Antwerp, Belgium.",
    "href": "/contact", "primaryAgent": "contact-router" },
  { "id": "lawyers-overview", "title": "The lawyers",
    "tags": ["lawyer","team","who","nir","deborah","partner"],
    "body": "Matters are supervised by senior partner Nir Zeltzer and Deborah Johnson. Each lawyer's direct mobile and email are listed on The Lawyers and Office pages for client contact.",
    "href": "/lawyers", "primaryAgent": "office-navigator" },
  { "id": "services-scope", "title": "Services offered",
    "tags": ["services","practice","civil","criminal","family","employment","real estate","traffic","commercial"],
    "body": "Orechdin advises private individuals, companies, and self-employed clients. The firm handles commercial, criminal, real estate and construction, civil, family, employment, traffic, residence and civil liability matters, rental disputes, and debt collection. Specialist counsel is engaged for foreign and international files.",
    "href": "/services", "primaryAgent": "services-guide" }
  /* …extend per project… */
]
```

### 3.8 The reply builder (verbatim)

```ts
export function buildLegalReply(args: {
  intent: NeoIntent; tone: NeoTone; locale: Locale;
  hits: KbEntry[]; routedAgent: string;
}): LegalReplyParts {
  const { intent, tone, locale, hits } = args;
  const profile = TONE_PROFILES[tone];

  const opener = profile.opener[locale];
  const bridge = profile.bridge[locale];

  const lead = hits[0];
  const support = hits.slice(1, 3);

  let body: string;
  if (lead) {
    body = `**${lead.title}** — ${lead.body}`;
    if (support.length > 0) {
      body += "\n\n" + support.map(h => `· _${h.title}_ — ${h.body}`).join("\n");
    }
  } else {
    body = locale === "nl"
      ? "Ik vond geen exact gepubliceerd citaat. Veiliger is om uw vraag rechtstreeks aan een advocaat van het kantoor voor te leggen."
      : locale === "fr"
        ? "Je n'ai pas trouvé de citation publiée précise. Il est plus prudent de poser votre question directement à un avocat du cabinet."
        : "I could not find an exact published citation. The safest path is to put your question directly to a lawyer at the office.";
  }

  const boundary = neoBoundaryLine(locale);

  let nextStep: string | undefined;
  if (intent === "contact_request") {
    nextStep = publicContactLine(locale);
  } else if (intent === "urgency_signal") {
    nextStep = locale === "nl" ? `Voor tijdgevoelige zaken: bel het kantoor op ${PHONE}.`
            : locale === "fr"  ? `Pour les affaires urgentes : appelez le cabinet au ${PHONE}.`
            :                    `For time-sensitive matters, call the office at ${PHONE}.`;
  } else if (intent === "out_of_scope") {
    nextStep = /* localised "consult a specialist" line */;
  } else if (lead?.href) {
    nextStep = /* localised "Next step: open <page>" line from routeLabel() */;
  }

  const disclaimer = lead ? DISCLAIMER[locale] : undefined;
  return { opener, bridge, body, boundary, nextStep, disclaimer };
}

export function renderLegalReply(p: LegalReplyParts): string {
  const out = [p.opener, p.bridge, "", p.body];
  if (p.nextStep) out.push("", `→ ${p.nextStep}`);
  out.push("", `_${p.boundary}_`);
  if (p.disclaimer) out.push("", `> ${p.disclaimer}`);
  return out.filter(Boolean).join("\n");
}
```

### 3.9 Follow-up chips (always 1–3, never invented)

```ts
function suggestFollowUps({intent, hits, locale}) {
  const out = [];
  // 1. KB-driven (one chip per supporting hit)
  for (const h of hits.slice(1, 3)) {
    out.push({ id: `kb-${h.id}`, label: trim(h.title, 38),
      prompt: locale === "nl" ? `Vertel mij meer over: ${h.title}`
            : locale === "fr" ? `Dites-m'en plus sur : ${h.title}`
            :                   `Tell me more about: ${h.title}` });
  }
  // 2. Intent-driven (lawyer-list, publish-areas, ask-contact, dpo …)
  // 3. Always offer "Speak with a lawyer" as the human handoff if room remains
  return out.slice(0, 3);
}
```

### 3.10 Intake ladder (the warm "next missing fact" question)

Only fires while `state ∈ { DRAFT_DISCOVERY, DRAFT_CASE_BUILDING }` and the
intent is *not* `contact_request | out_of_scope`. Picks the first missing
fact in this order: **issue → timeline → parties → location → documents**.

```ts
const PROMPTS = {
  issue:     { en: "Could you tell me, in your own words, what's going on?",
               nl: "Kunt u in uw eigen woorden vertellen wat er aan de hand is?",
               fr: "Pourriez-vous me raconter, avec vos propres mots, ce qui se passe ?" },
  timeline:  { en: "Roughly when did this start, or when did the last thing happen?",
               nl: "Wanneer is dit ongeveer begonnen, of wanneer is het laatste gebeurd?",
               fr: "À peu près quand est-ce que cela a commencé, ou quand le dernier fait s'est-il produit ?" },
  parties:   { en: "Who else is involved — a person, a company, an institution?",
               nl: "Wie is er nog betrokken — een persoon, een bedrijf, een instelling?",
               fr: "Qui d'autre est impliqué — une personne, une entreprise, une institution ?" },
  location:  { en: "Where did this take place — Antwerp, somewhere else in Belgium?",
               nl: "Waar is dit gebeurd — Antwerpen, ergens anders in België?",
               fr: "Où cela s'est-il passé — Anvers, ailleurs en Belgique ?" },
  documents: { en: "Anything in writing — letters, contracts, emails? Drop them here whenever you're ready.",
               nl: "Heeft u iets op papier — brieven, contracten, e-mails? Laat het hier vallen wanneer u klaar bent.",
               fr: "Avez-vous des écrits — lettres, contrats, courriels ? Déposez-les ici quand vous êtes prêt." },
};
```

Adaptive batching rule: if the user wrote ≥18 words and isn't stressed, two
linked questions may be combined; otherwise always exactly one question.

### 3.11 Metacognition (drives readiness + ladder)

```ts
function evaluateMetacognition(state, messages, files) {
  const text = messages.filter(m => m.role==="user")
                       .map(m => m.content_redacted).join(" ").toLowerCase();
  const hasTimeline = /\b(ago|last|year|month|week|day|date|when|since|before|after)\b/.test(text);
  const hasParty    = /\b(company|person|employer|landlord|tenant|spouse|partner|bank|insurance|government)\b/.test(text);
  const hasLocation = /\b(antwerp|belgium|brussels|ghent|flanders|court|office)\b/.test(text);
  const hasAmount   = /\b(\d+[\.,]?\d*\s*(euro|eur|€|usd|\$)|\d{3,})\b/.test(text);
  const knownFacts  = [hasTimeline,hasParty,hasLocation,hasAmount,files.length>0].filter(Boolean).length;
  return { knownFacts,
    missingCritical: [!hasTimeline && "Timeline or dates of events",
                      !hasParty   && "Parties involved",
                      messages.filter(m=>m.role==="user").length<2 && "Core problem description"].filter(Boolean),
    uncertaintyLevel: knownFacts>=4 ? "LOW" : knownFacts>=2 ? "MEDIUM" : "HIGH",
    summaryCompleteness: Math.min(100, Math.round((knownFacts/5)*100)),
  };
}
```

### 3.12 Optional swarm receipt (UX badge only — fully offline-safe)

The composer simulates a 3-node swarm cascade
(`gemini-1.5-flash → claude-3-haiku → gpt-4o-mini`) for telemetry/UI
("Online" / "Routing…" / "Replying from cache"). It **never blocks** the
reply — the deterministic composer above already produced the text. Health
state with 60s cooldown after 3 consecutive failures is tracked in memory.

If you don't want the badge, just emit `mode: "standard", provider: "static_fallback"`.

---

## 4. The streaming feel — *how the letters arrive*

### 4.1 Cadence rules (NeoTypewriter)

```ts
const step = text.length > 600 ? 6 : text.length > 320 ? 4 : text.length > 140 ? 3 : 2; // chars/tick
const intervalMs = 14;                                  // base tick
const jitter = () => 1 + (Math.random() - 0.5) * 0.3;   // ±15% per tick

const pauseAfter = (ch) =>
  ch === "." || ch === "!" || ch === "?" ? 220 :
  ch === "\n"                            ? 160 :
  ch === "," || ch === ";" || ch === ":" ?  90 : 0;
```

Behaviour:
- Honours `prefers-reduced-motion` → instant reveal.
- Click anywhere on the bubble → skip to the end (`"Tap to reveal the full reply"`).
- Wraps the **same** `NeoRichText` so Markdown materialises *as it arrives*
  (the `> disclaimer` becomes a hairline blockquote mid-stream, the `→`
  bullet sprouts an arrow, etc.).
- Trailing **bronze caret** during streaming:
  `<span class="ml-0.5 inline-block h-[0.95em] w-[2px] -mb-[2px] align-middle bg-orech-bronze/80 motion-safe:animate-pulse" />`

### 4.2 Why character-level (not token-level)?

Because the composer returns the full string locally in a single shot.
Letter-by-letter reveal at the UI layer gives the same human-typing feel
without needing a streaming backend. If you *do* have a streaming LLM,
just feed each chunk through the same component — set `revealed` to the
arrived prefix length on every chunk.

### 4.3 The typing indicator (before the bubble appears)

While `isGenerating` is true and no bubble has rendered yet:

```
●  ●  ●     Thinking…
```

Three pulsing bronze dots + an italic mist hint chosen per turn:

```ts
typingHint = files.length>0 && lastUser.length<80 && assistantCount<=1
  ? "Reading your file…"
  : lastUser.length>280
    ? "Reading your message…"
    : ["Thinking…","Putting that together…","Writing back…"][messages.length % 3];
```

---

## 5. The shell — *the geometry around the chat*

### 5.1 Anatomy

```
                                                  ┌─ vertical rail launcher
                                                  │   "Neo AI" written ⌘
                                                  │   right edge, top:50%
                                                  │   transform-y: -50%
                                                  │   z-index: 80
                                                  ▼
   ┌──────────────────────────────────────────────┬──┐
   │                                              │  │
   │           main page content                  │N │
   │                                              │e │
   │                                              │o │
   │                                              │  │
   │                                              │A │
   │                                              │I │
   │                                              │  │
   └──────────────────────────────────────────────┴──┘

   When OPEN (lg+): a fixed right-hand panel slides in from the right
   (translateX(100%) → 0). Width is user-resizable on a left-edge drag
   handle, persisted to localStorage("neo_panel_width_v1").

   ┌────────────────────────────────────┬─────────┐
   │                                    │┌─ NEO ──│  ← header: status dot
   │   page content (pushed left by     ││ Online │     · italic name
   │   body.neo-hub-open padding)       │├────────│     · ⤢ Case Room
   │                                    ││ msgs   │     · New / × close
   │                                    ││ ↓ pinned
   │                                    ││ to bottom
   │                                    │├────────│
   │                                    ││ ◎  composer  ➤
   │                                    │└────────│
   └────────────────────────────────────┴─────────┘
```

Constants:

```ts
const PANEL_WIDTH_KEY  = "neo_panel_width_v1";
const PANEL_MIN_W      = 380;
const PANEL_DEFAULT_W  = 420;
const PANEL_MAX_VW_RESERVE = 120;  // never let the panel cover the whole vp
```

Mobile: panel becomes a full-height overlay (right: 52px so the rail
remains tap-able), backdrop dims the page, body scroll locks. Keyboard
`Esc` closes; close button refocuses the rail for screen readers.

### 5.2 Three streaming-state visual cues

| State | Status dot | Subtitle | Caret in bubble |
|---|---|---|---|
| Idle | emerald, slow pulse | "Online" | — |
| Generating | bronze, fast ping | "Typing…" | bronze blinking pipe |
| Degraded | amber, no animation | "Replying from cache" | — |

### 5.3 Layout rule that pins the empty state to the bottom

Otherwise the welcome greeting floats at the top of an empty panel — wrong
visual rhythm. The fix:

```css
.nwx-list { display: flex; flex-direction: column; min-height: 100%; }
.nwx-list > .nwx-empty:only-child { flex: 1 1 auto; }
```

The `EmptyState` itself is `flex flex-col justify-end gap-6 pb-2`.

### 5.4 Composer — what the user touches

```
┌────────────────────────────────────────────────────────────────────┐
│ 📎  📋  🎙   Write a message…                                  ➤  │
└────────────────────────────────────────────────────────────────────┘
   │   │   │                                                       │
   │   │   └─ mic: Web Speech API (en-US/nl-BE/fr-BE), interim+final
   │   └──── paste: opens "paste evidence as text" → exhibit pasted-evidence-NNN.txt
   └──────── attach: pdf/jpg/png/doc/docx/xls/xlsx/txt; ≤25MB; ≤10 files
```

Composer rules:
- `<textarea rows=1 max-h-32 resize-none>`, max 1500 chars hard cap.
- Enter sends, Shift+Enter newline, IME-composing safe (`!isComposing`).
- Voice: click mic to start; chunks update as user speaks; voice-originated
  user bubbles render with a small mic glyph next to the text.
- Drag-and-drop a file anywhere on the panel → bronze dashed overlay
  ("Drop documents to attach"). Files chip below the composer.
- Submit button disabled when generating or input is empty.

---

## 6. Design tokens — *the look*

```ts
// Tailwind theme.extend.colors.orech
ink:        "#181412"       // text-on-paper
paper:      "#F6F4EE"       // premium cream background
slate:      "#EDEAE0"       // warm ivory surface (header strip)
mist:       "#56514B"       // body mist (secondary text)
line:       "#D9D5CB"       // hairline borders
bronze:     "#9A6B1F"       // single accent — one element per viewport max
bronzeMuted:"#C49A5A"
gold:       "#B8870B"       // legacy highlight
lineSoft:   "rgba(24,20,18,0.08)"

// And the dark NEO tones for the panel chrome on dark variants:
neo.panel:   "#181412"
neo.surface: "#26211D"
neo.border:  "#3F3A34"
neo.accent:  "#9A6B1F"
neo.muted:   "rgba(246,244,238,0.55)"
```

Type stack (load via `next/font` or `@font-face`):

```
font-display        : Playfair Display       (light/regular, headlines)
font-display-italic : Cormorant Garamond Italic   ← THIS is the "academic italic"
font-prose          : Source Serif 4         (long-form body)
font-sans           : Inter                  (UI chrome only)
font-mono           : JetBrains Mono         (eyebrows, status text, "Neo AI" rail)
```

Critical CSS rules from `app/globals.css`:

```css
/* The signature italic — applied to <em> in display headings AND
   exposed as the .italic-display utility (used for "NEO" in the panel header) */
h1 em, h2 em, h3 em, .italic-display {
  font-family: var(--font-display-italic), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  color: theme("colors.orech.bronze");
  letter-spacing: -0.005em;
}

/* Long-form text adopts Source Serif 4 by default; UI chrome opts out
   with explicit font-sans / font-mono on its container. */
p, blockquote, li, dd, address, figcaption {
  font-family: var(--font-prose), Charter, "Iowan Old Style", Georgia, serif;
  font-feature-settings: "kern","liga","calt","onum","ss01";
}

/* When the panel is open on lg+, push the page content left so the
   panel doesn't overlap content. */
@media (min-width: 1024px) {
  body.neo-hub-open { padding-right: 420px; }
}

/* Bronze focus ring on cream */
:focus-visible {
  @apply outline-none ring-2 ring-orech-bronze ring-offset-2 ring-offset-orech-paper;
}
::selection { background-color: rgba(154, 107, 31, 0.18); color: inherit; }
```

Easing & timing:

```ts
transitionTimingFunction.neo: "cubic-bezier(0.19, 1, 0.22, 1)"
transitionDuration.neo:       "280ms"   // panel slide
typewriter intervalMs:        14        // base tick
```

Box-shadows (the "panel feels like glass" cue):

```ts
"neo-glass":
  "-12px 0 40px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.4)"
```

---

## 7. Conversation state machine

```
DRAFT_DISCOVERY
   │  (msgs ≥ 2  OR  files > 0)
   ▼
DRAFT_CASE_BUILDING
   │  (intent clear  AND  msgs ≥ 4  AND  user hits "Proceed")
   ▼
PENDING_SUBMIT_CONFIRMATION
   │
   ▼
PENDING_EMAIL_VERIFICATION  ←— OTP / magic link / demo PIN
   │  (email verified)
   ▼
VERIFIED_READY_FOR_FINAL_REVIEW
   │  (3 consents ticked: rep_understanding, info_auth, use_consent)
   ▼
PENDING_FINAL_SUBMISSION
   │
   ▼
SUBMITTED_FOR_LEGAL_REVIEW   ──→  REVIEW_ACKNOWLEDGED
```

Other terminal states: `NEEDS_MORE_INFORMATION`, `ABANDONED`, `EXPIRED`,
`REJECTED_SYSTEM`, `REJECTED_POLICY`.

The chat surface only renders messages while in
`DRAFT_DISCOVERY | DRAFT_CASE_BUILDING`. The intake screens
(`NeoAuth → NeoSubmitReview → success card`) replace the surface in the
later states.

Readiness score is a 0–5 weighted metric exposed under the chat as a
horizontal "intake progress" bar with a "Proceed to summary" CTA when
ready.

---

## 8. Multi-language behaviour matrix

| Trigger | en | nl | fr |
|---|---|---|---|
| greeting opener | "Thank you for sharing that." | "Dank u voor uw bericht." | "Merci pour votre message." |
| boundary line | "NEO offers general orientation grounded only in Orechdin's published material — not legal advice." | "NEO geeft algemene oriëntatie op basis van het gepubliceerde materiaal van Orechdin. Geen juridisch advies." | "NEO fournit une orientation générale basée sur le matériel publié d'Orechdin. Pas de conseil juridique." |
| timeline question | "Roughly when did this start, or when did the last thing happen?" | "Wanneer is dit ongeveer begonnen, of wanneer is het laatste gebeurd?" | "À peu près quand est-ce que cela a commencé, ou quand le dernier fait s'est-il produit ?" |
| follow-up: "Who are the lawyers?" | same | "Wie zijn de advocaten?" | "Qui sont les avocats ?" |
| dictation locale | en-US | nl-BE | fr-BE |

Mirror the user's language reactively per turn — never override based on the
site's URL locale.

---

## 9. Copy-paste files (the entire chatroom)

> The composer + renderer + typewriter + shell, in the exact order to drop
> into a Next.js App-Router + Tailwind project. Total ~1,200 lines.

### 9.1 `lib/neo/types.ts`

```ts
export interface KbEntry {
  id: string;
  title: string;
  tags: string[];
  body: string;
  href: string | null;
  primaryAgent: string;
}

export type NeoAgentId =
  | "auto" | "legal-guide" | "services-guide" | "office-navigator"
  | "document-helper" | "knowledge-finder" | "intake-assistant"
  | "contact-router" | "policy-helper";

export type NeoTier = "orientation" | "routing" | "reference";

export interface NeoAgent {
  id: Exclude<NeoAgentId, "auto">;
  label: string;
  shortLabel: string;
  description: string;
  tier: NeoTier;
  keywords: string[];
}
```

### 9.2 `lib/neo/agents.ts`

The full 8-agent table from §3.4 with `routeAgent(text)` and `agentById(id)`.

### 9.3 `lib/neo/kb-search.ts`

The `scoreEntry` + `searchKb` from §3.5.

### 9.4 `lib/neo/communication.ts`

`detectLanguage`, `detectIntent`, `selectTone`, `TONE_PROFILES`,
`neoBoundaryLine`, `isUrgent`. All functions in §3.1–3.3 + §2.2 + §2.3.

### 9.5 `lib/neo/legal-reply.ts`

`buildLegalReply`, `renderLegalReply`, `suggestFollowUps`, `publicContactLine`,
`DISCLAIMER`, `NEXT_STEP_LABELS`. Per §2.4 + §3.8 + §3.9.

### 9.6 `lib/neo/intake-questions.ts`

`nextBestQuestion`, `listOpenGaps`, `PROMPTS`, `PAIRED`, `looksStressed`.
Per §3.10.

### 9.7 `lib/neo/intake-state.ts`

`executeMarkovTransition`, `calculateReadiness`, `evaluateMetacognition`.
Per §3.11 + §7.

### 9.8 `lib/neo/persona.ts`

The `PRIME_DIRECTIVE` constant (§1.1), the 5 `LegalPersonas` (§1.2),
`LAWYER_ASSISTANT_PERSONA`, `NEO_PRODUCT`. **All verbatim.**

### 9.9 `lib/neo/compose-reply.ts` — the orchestrator

```ts
export async function composeNeoReply(opts: ReplyOptions): Promise<NeoReply> {
  const message  = opts.message || "";
  const language = (opts.locale as Locale) || detectLanguage(message);
  const intent   = detectIntent(message);
  const tone     = selectTone(intent);

  const routed = opts.selectedAgent && opts.selectedAgent !== "auto"
    ? opts.selectedAgent : routeAgent(message);

  // --- Ground in KB
  const seedQuery = message.trim().length >= 4 ? message : intentSeed(intent);
  const direct = searchKb(seedQuery, 5);
  const agentMatched = direct.filter(e => e.primaryAgent === routed);
  const hits = (agentMatched.length ? agentMatched : direct).slice(0, 3);
  const allowContact = contactInfoAllowed(intent, routed);
  const hitsForBody  = allowContact ? hits : hits.filter(h => h.id !== "contact-general");

  // --- Build the structured reply
  const parts = buildLegalReply({ intent, tone, locale: language,
                                  hits: hitsForBody, routedAgent: routed });
  let text = renderLegalReply(parts);

  // --- Optional intake-ladder question
  const inLadder = (opts.currentState === "DRAFT_DISCOVERY" ||
                    opts.currentState === "DRAFT_CASE_BUILDING")
                 && intent !== "contact_request"
                 && intent !== "out_of_scope";
  if (inLadder) {
    const metacog = evaluateMetacognition(opts.currentState!, history, files);
    const nq = nextBestQuestion({ report: metacog,
      fileCount: files.length, lastUserMessage: lastUser, locale: language });
    if (nq) text = `${text}\n\n${nq.prompt}`;
  }

  return {
    text,
    citations: hits.map(h => ({ id: h.id, title: h.title, href: h.href })),
    followUps: suggestFollowUps({ intent, hits: hitsForBody, routedAgent: routed, locale: language }),
    swarmMeta: /* the optional 3-node simulated cascade for UX */ {} as SwarmExecutionReceipt,
  };
}
```

The full file (~380 lines) is the verbatim §3 logic plus the swarm simulator.

### 9.10 `components/neo/neo-rich-text.tsx` — *the renderer (full file, ≤90 lines)*

```tsx
"use client";
import React from "react";

export function NeoRichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (line === "") return <div key={idx} aria-hidden className="h-1" />;

        if (line.startsWith("> ")) return (
          <p key={idx} className="border-l-2 border-orech-bronze/40 pl-2 text-[0.72rem] italic leading-snug text-orech-mist/85">
            {renderInline(line.slice(2))}
          </p>
        );
        if (line.startsWith("→ ")) return (
          <p key={idx} className="flex items-start gap-1.5 text-[0.82rem] font-medium text-orech-ink">
            <span aria-hidden className="text-orech-bronze">→</span>
            <span>{renderInline(line.slice(2))}</span>
          </p>
        );
        if (line.startsWith("· ")) return (
          <p key={idx} className="flex items-start gap-1.5 pl-1 text-[0.78rem] leading-snug text-orech-mist/95">
            <span aria-hidden className="text-orech-bronze/70">·</span>
            <span>{renderInline(line.slice(2))}</span>
          </p>
        );
        return <p key={idx} className="text-[0.84rem] leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_)/g;

function renderInline(text: string): React.ReactNode {
  return text.split(TOKEN).filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-orech-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_"))
      return <em key={i} className="italic text-orech-mist/95">{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
```

### 9.11 `components/neo/neo-typewriter.tsx` — *the streaming reveal (full file, ~130 lines)*

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { NeoRichText } from "./neo-rich-text";

interface NeoTypewriterProps {
  text: string;
  active: boolean;
  onComplete?: () => void;
  charsPerTick?: number;
  intervalMs?: number;
}

export function NeoTypewriter({ text, active, onComplete, charsPerTick, intervalMs = 14 }: NeoTypewriterProps) {
  const [revealed, setRevealed] = useState<number>(active ? 0 : text.length);
  const reduceMotionRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!active || text.length === 0) { setRevealed(text.length); return; }
    if (reduceMotionRef.current)      { setRevealed(text.length); onCompleteRef.current?.(); return; }

    setRevealed(0);
    const step = charsPerTick ??
      (text.length > 600 ? 6 : text.length > 320 ? 4 : text.length > 140 ? 3 : 2);
    const pauseAfter = (ch: string) =>
      ch === "." || ch === "!" || ch === "?" ? 220 :
      ch === "\n"                            ? 160 :
      ch === "," || ch === ";" || ch === ":" ?  90 : 0;
    const jitter = () => 1 + (Math.random() - 0.5) * 0.3;

    let cur = 0, cancelled = false, timeoutId: number | null = null;
    const tick = () => {
      if (cancelled) return;
      const next = Math.min(text.length, cur + step);
      const lastChar = text[next - 1] ?? "";
      cur = next; setRevealed(cur);
      if (cur >= text.length) { onCompleteRef.current?.(); return; }
      timeoutId = window.setTimeout(tick, intervalMs * jitter() + pauseAfter(lastChar));
    };
    timeoutId = window.setTimeout(tick, intervalMs);
    return () => { cancelled = true; if (timeoutId !== null) window.clearTimeout(timeoutId); };
  }, [active, text, charsPerTick, intervalMs]);

  const skip = () => {
    if (revealed >= text.length) return;
    setRevealed(text.length); onCompleteRef.current?.();
  };

  const isStreaming = active && revealed < text.length;
  const display = isStreaming ? text.slice(0, revealed) : text;

  return (
    <div onClick={isStreaming ? skip : undefined}
         role={isStreaming ? "button" : undefined}
         aria-label={isStreaming ? "Tap to reveal the full reply" : undefined}
         className={isStreaming ? "cursor-pointer" : undefined}>
      <NeoRichText text={display} />
      {isStreaming && (
        <span aria-hidden
              className="ml-0.5 inline-block h-[0.95em] w-[2px] -mb-[2px] align-middle bg-orech-bronze/80 motion-safe:animate-pulse" />
      )}
    </div>
  );
}
```

### 9.12 `components/neo/neo-context.tsx` — *state provider (~300 lines)*

Lifts `messages`, `assistantMeta`, `isGenerating`, `state`, `uploadedFiles`,
`open` out of components so multiple surfaces (panel + full-screen "Case
Room") share the same conversation. The single non-trivial method:

```ts
const sendMessage = useCallback(async (raw: string, options?: { via?: "voice"|"keyboard" }) => {
  const text = raw.trim();
  if (!text || isGenerating) return;

  const userMsg: IntakeMessage = {
    id: crypto.randomUUID(),
    intake_draft_id: "draft-1",
    role: "user",
    content_redacted: text,
    timestamp: new Date().toISOString(),
    sequence_no: messages.length + 1,
    via: options?.via ?? "keyboard",
  };
  const next = [...messages, userMsg];
  setMessages(next);
  setIsGenerating(true);

  try {
    const out = await composeNeoReply({
      message: text,
      selectedAgent,
      currentState: state,
      uploadedFiles,
      messageHistory: next.map(m => ({ role: m.role, content: m.content_redacted })),
    });
    const replyId = crypto.randomUUID();
    setMessages(m => [...m, {
      id: replyId, intake_draft_id: "draft-1", role: "assistant",
      content_redacted: out.text || "I'm here. Could you tell me a little more about your situation?",
      timestamp: new Date().toISOString(), sequence_no: next.length + 1,
    }]);
    setAssistantMeta(meta => ({ ...meta,
      [replyId]: { citations: out.citations, swarm: out.swarmMeta, followUps: out.followUps }
    }));
  } catch (e: unknown) {
    setMessages(m => [...m, {
      id: crypto.randomUUID(), intake_draft_id: "draft-1", role: "assistant",
      content_redacted: `Sorry — I couldn't reach my system just now (${e instanceof Error ? e.message : "unknown"}). Please try again, or reach the office directly.`,
      timestamp: new Date().toISOString(), sequence_no: next.length + 1,
    }]);
  } finally {
    setIsGenerating(false);
  }

  if (state === "DRAFT_DISCOVERY" && (messages.length >= 2 || uploadedFiles.length > 0)) {
    setState("DRAFT_CASE_BUILDING");
  }
}, [isGenerating, messages, selectedAgent, state, uploadedFiles]);
```

`open` state is persisted to `localStorage("neo_sidebar_open_v1")`.

### 9.13 `components/neo/neo-shell.tsx` — *the panel + rail (~410 lines)*

Key behaviours:

1. **Vertical rail launcher** (`fixed right-0 top-1/2 -translate-y-1/2 z-[80]`)
   with `writingMode: "vertical-rl"`, label `"Neo AI"`, font-mono uppercase
   tracking-[0.14em] bronze, paper background, hairline border, hides on
   `lg+` when the panel is open.
2. **The panel** (`fixed bottom-0 top-0 right-0 z-[70]`) slides in via
   `translateX(100%) → translate-x-0` over 350ms cubic-bezier(0.19,1,0.22,1).
   Width starts at 420px, drag-handle on left edge resizes between 380px
   and `viewportWidth − 120px`, persisted.
3. **Mobile backdrop** (`fixed inset-0 z-[60] bg-orech-slate/80 lg:hidden`)
   click-to-close.
4. **Header** (`px-4 py-3 border-b border-orech-line bg-orech-slate/40`):
   - status dot (emerald / bronze / amber)
   - `<p class="italic-display text-[1.15rem]">NEO</p>`
   - status text ("Online" / "Typing…" / "Replying from cache")
   - link → `/case` (full-screen Case Room)
   - "New" button (resets conversation)
   - close × button
5. **Body** = `<NeoChatSurface size="panel" />` (or one of the intake screens
   when state ∈ verification flow).
6. **Esc** closes the panel and refocuses the rail. Focus trap on open
   focuses the close button after 50ms.
7. **`body.neo-hub-open`** class is toggled on `lg+` so the page content
   gets `padding-right: 420px` (the panel doesn't overlap content).

### 9.14 `components/neo/neo-chat-surface.tsx` — *the messages + composer (~640 lines)*

Three rendering branches per message:

```tsx
{isUser ? (
  <p className="whitespace-pre-wrap">
    {msg.via === "voice" && <MicGlyph />}
    {msg.content_redacted}
  </p>
) : isStreaming ? (
  <NeoTypewriter text={msg.content_redacted} active onComplete={() => markRevealed(msg.id)} />
) : (
  <NeoRichText text={msg.content_redacted} />
)}
```

`streamingId` is derived as "the *most recent* assistant message that
hasn't been revealed yet". On first mount, all pre-existing assistant
messages are marked revealed, so re-opening the panel never re-types the
history.

The empty-state greeting changes by hour: "Good morning / afternoon /
evening / Hello", computed *after mount* to avoid hydration mismatch.
Three quick prompts (`QUICK_PROMPTS`) sit underneath.

Below the user's message, while generating: the three pulsing dots + the
rotating italic hint (§4.3).

After the assistant's last message, when not generating: the
`followUps` chips render as rounded outlined pills (`rounded-full
border border-orech-line bg-orech-paper/80 px-3 py-1 text-[0.74rem]
hover:border-orech-bronze/50`).

### 9.15 `lib/neo/use-speech-recognition.ts` — *Web Speech API wrapper*

Stateless hook. Exposes `{ supported, listening, interim, error, start, stop, cancel }`.
Locale → BCP-47 mapping: `nl→nl-BE, fr→fr-BE, en→en-US`. Continuous +
interim results. Tears down on unmount. The composer treats every
dictation chunk as new input by re-baselining against an `dictationBaseRef`
snapshot taken when dictation starts — so interim chunks replace only the
dictated tail.

### 9.16 (optional) Server actions for live intake — `server/actions/neo-submit-intake.ts`

Three actions, gated by `INTAKE_MODE = "off" | "demo" | "live"`:

- `submitVerificationEmail(email)` — sends OTP (or simulates in demo)
- `verifyOtpCode(email, code)` — validates the code
- `submitDossierForReview(draftId, consents, email)` — persists the dossier

In `demo` mode they return synthetic IDs; in `live` mode they throw a
"not implemented" error until you wire Resend / your DB. **The chatroom
itself works in `off` mode** — only the intake submission is gated.

---

## 10. Wiring it into a project

### 10.1 Mount once at the root layout

```tsx
// app/layout.tsx (Next.js App Router)
import { NeoProvider } from "@/components/neo/neo-context";
import { NeoShell } from "@/components/neo/neo-shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NeoProvider>
          {children}
          <NeoShell />
        </NeoProvider>
      </body>
    </html>
  );
}
```

That's it. The rail self-mounts top-right; the panel slides in on click;
the composer streams the deterministic reply.

### 10.2 Required Tailwind extensions

Copy the `theme.extend` block from §6 into your `tailwind.config.ts`. Make
sure your `content` glob covers `./components/**/*.{ts,tsx}` and
`./lib/**/*.{ts,tsx}`.

### 10.3 Required global CSS

Copy the `h1 em, h2 em, h3 em, .italic-display` rule + the
`body.neo-hub-open` media query + the `:focus-visible` rule from §6 into
your `globals.css`.

### 10.4 Required font loads

```tsx
// app/layout.tsx
import { Playfair_Display, Cormorant_Garamond, Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";

const display       = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["400","500"] });
const displayItalic = Cormorant_Garamond({ subsets: ["latin"], style: "italic", weight: "400", variable: "--font-display-italic" });
const prose         = Source_Serif_4({ subsets: ["latin"], variable: "--font-prose" });
const sans          = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono          = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// <html className={`${display.variable} ${displayItalic.variable} ${prose.variable} ${sans.variable} ${mono.variable}`}>
```

### 10.5 Project-specific edits

You only ever edit three things per new project:

1. **`data/neo-kb.json`** — the facts (titles, bodies, hrefs, tags).
   Title becomes the **bold** lead in the body. Body is pasted verbatim.
2. **`lib/neo/agents.ts`** — agent labels + keyword sets (8 routing slots
   with first-match-wins priority).
3. **`lib/neo/persona.ts`** + **`lib/neo/communication.ts`** language
   constants — swap "Orechdin / Antwerp / law office" for your domain.
   Keep the structure; replace the nouns.

The intent regex set, the tone profiles, the renderer, the typewriter, the
shell, the streaming cadence, the empty-state geometry — none of it
changes between projects. That's the whole point of this document.

### 10.6 Plain-HTML / non-Next port

If you're not on React, the contract is unchanged:

1. Build the same composer in any language. It's a pure function:
   `compose(message, history, state, files, locale) → { text, citations, followUps }`.
2. Serve `text` to the client.
3. Render `text` with the same Markdown-subset rules (the renderer is ~80
   LOC and trivial to port — see §2.1 + §9.10).
4. Reveal char-by-char with the same cadence (§4.1 + §9.11).
5. Mount the same panel geometry (§5).

---

## 11. The non-negotiables (the things that make it feel like NEO and not a chatbot)

If you only carry six things to a new project, carry these:

1. **Reply structure**: opener → bridge → body (`**Title** — body` + optional `· _Sub_ — body`) → optional `→ next-step` → `_boundary_` italic → optional `> disclaimer`. Always in this order. Always.
2. **Three tones × three locales**: `professional_empathetic | clear_direct | calm_reassuring` × `en | nl | fr`. Pick by intent, never by site URL.
3. **Markdown-subset renderer**: only `**`, `_`, `> `, `→ `, `· `. No raw HTML. No `<a>` inside body — citations live in their own row.
4. **Typewriter cadence**: 14ms tick × jittered ±15%, adaptive char-step (2/3/4/6 by length), pauses (220/160/90 ms) after `.!? \n ,;:`. Click to skip. Honour `prefers-reduced-motion`.
5. **Geometry**: vertical rail right-edge launcher with `writing-mode: vertical-rl`, slide-in panel from the right, draggable left-edge resize, `body.neo-hub-open { padding-right: 420px }` so content reflows.
6. **Cormorant Garamond italic** for the persona name in the header (`.italic-display`), bronze accent (#9A6B1F), paper cream background (#F6F4EE), Source Serif 4 for body. This is the "academic feel" the visitor recognises before reading a single word.

Everything else is replaceable. These six are NEO.

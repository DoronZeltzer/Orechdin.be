import { type Locale } from "./legal-reply";
import { type NeoTone } from "./communication";
import { type KbEntry } from "./types";

export interface CompilePromptInput {
  systemPrompt: string;
  locale: Locale;
  tone: NeoTone;
  routedAgent: string;
  intent: string;
  userMessage: string;
  kbHits: KbEntry[];
  metacogSummary?: { knownFacts: number; missingCritical: string[]; uncertaintyLevel: string };
  messageHistory?: { role: string; content: string }[];
  translatorAnnotations?: string;
  advisoryContext?: string;
}

const LOCALE_INSTRUCTION = {
  en: "You must reply ONLY in English, regardless of the input language. Do not mix languages. Do NOT mirror the user.",
  nl: "U moet UITSLUITEND in het Nederlands antwoorden, ongeacht de brontaal van de bezoeker. Pas u NOOIT aan de taal van de bezoeker aan. Gebruik uitsluitend Nederlands.",
  fr: "Vous devez répondre UNIQUEMENT en français, quelle que soit la langue source. Ne mélangez pas les langues. Ne reflétez pas l'utilisateur.",
};

const TONE_INSTRUCTION: Record<NeoTone, string> = {
  professional_empathetic: "Adopt a warm, reassuring, and deeply empathetic tone. Acknowledge emotional difficulty without being overly dramatic.",
  clear_direct: "Adopt a highly direct, crisp, and transactional tone. Be polite but get straight to the point.",
  calm_reassuring: "Adopt a professional, balanced, and objective tone. Be helpful and clear without undue emotion.",
};

export function compilePrompt(input: CompilePromptInput): string {
  const parts: string[] = [];

  parts.push(`<system>\n${input.systemPrompt}\n</system>`);
  
  const langRule = LOCALE_INSTRUCTION[input.locale] || LOCALE_INSTRUCTION["en"];
  parts.push(`<language_rule>\n${langRule}\n</language_rule>`);
  
  parts.push(`<tone>\n${TONE_INSTRUCTION[input.tone] || TONE_INSTRUCTION.professional_empathetic}\n</tone>`);
  
  parts.push(`<agent_context>
Routed Agent: ${input.routedAgent}
Detected Intent: ${input.intent}
</agent_context>`);

  if (input.kbHits && input.kbHits.length > 0) {
    const kbContent = input.kbHits.map((kb, i) => `[KB-ENTRY-${i+1} Title: ${kb.title}]\n${kb.body}`).join("\n\n");
    parts.push(`<approved_knowledge_base>\n${kbContent}\n</approved_knowledge_base>`);
  }

  if (input.metacogSummary) {
    parts.push(`<metacognition>
Known facts: ${input.metacogSummary.knownFacts}
Missing critical facts: ${(input.metacogSummary.missingCritical || []).join(", ") || "None"}
Uncertainty Level: ${input.metacogSummary.uncertaintyLevel}
</metacognition>`);
  }

  if (input.translatorAnnotations) {
    parts.push(input.translatorAnnotations); // Already formatted with <translator_analysis>
  }

  if (input.advisoryContext) {
    parts.push(input.advisoryContext); // Already formatted with <advisory_guidance>
  }

  if (input.messageHistory && input.messageHistory.length > 0) {
    const history = input.messageHistory.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    parts.push(`<conversation_history>\n${history}\n</conversation_history>`);
  }

  parts.push(`<user_message>\n${input.userMessage}\n</user_message>`);

  parts.push(`<output_rules>
1. Always adhere to the language rule.
2. Use italics *like this* for emphasis or *NEO* if needed.
3. Keep the response concise, respecting word limits.
4. Do NOT proactively provide phone numbers or emails unless the user explicitly requested contact.
5. NEVER invent facts, names, or laws. Ground EVERYTHING in the approved knowledge base.
6. Do NOT cite the internal "KB-ENTRY-*" source codes in your response. Integrate the knowledge naturally.
7. NEVER invent, copy-paste generic, or assume specific legal deadlines, statutes, or procedures (e.g., do not say "you have 30 days" unless the KB explicitly says that for this exact issue). If the KB does not contain the answer, state that a lawyer must determine the exact procedure.
</output_rules>`);

  return parts.join("\n\n");
}

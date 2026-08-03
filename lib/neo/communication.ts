/**
 * NEO communication layer — intent detection, language inference, urgency,
 * and tone selection. Donor patterns: Verinox Communication Suite + NEO v7.0
 * "platform-only context" rule. NIR-WEBSITE KB remains the only fact source.
 */

export type NeoIntent =
  | "greeting"
  | "contact_request"
  | "scope_question"
  | "lawyer_question"
  | "office_question"
  | "privacy_question"
  | "document_question"
  | "urgency_signal"
  | "clarification"
  | "out_of_scope"
  | "general";

/** True when the user asks for today's date, day, or time — not a legal urgency cue. */
export function isDateOrTimeQuestion(message: string): boolean {
  const m = (message || "").toLowerCase();
  return /(what('s| is) (the )?(date|day|time)|what (date|day|time)|what time is it|welke datum|welke dag|hoe laat is het|quelle date|quelle heure|quel jour|quelle heure est-il)/i.test(
    m,
  );
}

/** True when the user asks for weather, news, sports, or other non-legal trivia. */
export function isGeneralKnowledgeQuestion(message: string): boolean {
  const m = (message || "").toLowerCase();
  if (isDateOrTimeQuestion(m)) return true;
  return /(weather|weer|météo|forecast|temperature|rain|snow|sunny|who won|football score|stock price|bitcoin|tell me a joke|capital of|recipe for|translate this)/i.test(
    m,
  );
}

export type NeoTone = "professional_empathetic" | "clear_direct" | "calm_reassuring";

export interface ToneProfile {
  id: NeoTone;
  label: string;
  warmth: number;
  directness: number;
  /** Opening fragment (locale-aware fallback in the composer). */
  opener: { en: string; nl: string; fr: string };
  /** Closing fragment when offering next step. */
  bridge: { en: string; nl: string; fr: string };
}

export const TONE_PROFILES: Record<NeoTone, ToneProfile> = {
  professional_empathetic: {
    id: "professional_empathetic",
    label: "Professional · empathetic",
    warmth: 0.8,
    directness: 0.6,
    opener: {
      en: "Thank you for sharing that.",
      nl: "Dank u voor uw bericht.",
      fr: "Merci pour votre message.",
    },
    bridge: {
      en: "Here is what I can confirm from the office's published material:",
      nl: "Dit kan ik bevestigen op basis van het gepubliceerde materiaal van het kantoor:",
      fr: "Voici ce que je peux confirmer à partir du matériel publié du cabinet :",
    },
  },
  clear_direct: {
    id: "clear_direct",
    label: "Clear · direct",
    warmth: 0.4,
    directness: 0.95,
    opener: {
      en: "Acknowledged.",
      nl: "Begrepen.",
      fr: "Bien reçu.",
    },
    bridge: {
      en: "Direct facts from the firm's site:",
      nl: "Directe feiten van de website van het kantoor:",
      fr: "Faits directs depuis le site du cabinet :",
    },
  },
  calm_reassuring: {
    id: "calm_reassuring",
    label: "Calm · reassuring",
    warmth: 0.95,
    directness: 0.45,
    opener: {
      en: "Take a moment — you are in the right place.",
      nl: "Neem even de tijd — u bent hier op de juiste plek.",
      fr: "Prenez un moment — vous êtes au bon endroit.",
    },
    bridge: {
      en: "Here is calm, factual orientation from what the office publishes:",
      nl: "Hier is een rustige, feitelijke oriëntatie op basis van wat het kantoor publiceert:",
      fr: "Voici une orientation calme et factuelle basée sur ce que le cabinet publie :",
    },
  },
};

/**
 * Lightweight Belgian-context language sniffer. Defaults to English.
 * Avoids inventing locale routes; just hints which greeting/copy to use.
 */
export function detectLanguage(text: string): "en" | "nl" | "fr" {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "en";

  const dutchHits = /(\bde\b|\bhet\b|\been\b|\bik\b|\bjullie\b|advocaat|kantoor|vraag|hallo|goedemiddag|alstublieft|graag|dank u)/.test(t);
  const frenchHits = /(\bje\b|\bvous\b|\bnous\b|bonjour|avocat|cabinet|merci|s'il vous plait|aide|demande)/.test(t);

  if (frenchHits && !dutchHits) return "fr";
  if (dutchHits) return "nl";
  return "en";
}

/**
 * Detects user intent. Pattern donor: Verinox conversationIntelligence — adapted
 * to a legal-orientation scope, not workflow construction.
 */
export function detectIntent(message: string): NeoIntent {
  const m = (message || "").toLowerCase().trim();
  if (!m) return "general";

  if (/^(hi|hello|hey|good (morning|afternoon|evening)|hallo|goeden?dag|bonjour|salut|dag)\b/.test(m)) {
    return "greeting";
  }

  if (isGeneralKnowledgeQuestion(m)) {
    return "out_of_scope";
  }

  if (/(call|phone|telephone|tel\.?|email|e-?mail|address|appointment|book|reach|contact|opbellen|bellen|afspraak|prendre rendez|courriel|appel|joindre)/i.test(m)) {
    return "contact_request";
  }

  if (/(privacy|gdpr|avg|cookie|data protection|dpo|données|protection des données|persoonsgegevens)/i.test(m)) {
    return "privacy_question";
  }

  if (/(nir|deborah|partner|team|who works|qui travaille|wie werkt|advocaat|lawyer|over|about you|about the office|kantoor|cabinet|address|locatie|hours)/i.test(m)) {
    return "office_question";
  }

  if (/(document|contract|paper|sign|review|upload|piece|stuk|attachment|annexe)/i.test(m)) {
    return "document_question";
  }

  if (
    !isDateOrTimeQuestion(m) &&
    /(deadline|urgent|asap|summons|dagvaarding|police|politie|arrested|arrestation|jail|gevangenis|hearing|audience|delay|need help|help me|today|tomorrow)/i.test(
      m,
    )
  ) {
    return "urgency_signal";
  }

  if (/(service|practice|do you handle|do you do|family|divorce|criminal|civil|commercial|employment|real estate|property|traffic|debt|liability|rental|location|building|construction|residence|abode)/i.test(m)) {
    return "scope_question";
  }

  if (/(another lawyer|second opinion|other firm|us law|american|french law|tax in|notar)/i.test(m)) {
    return "out_of_scope";
  }

  if (/(\?|how|why|what|when|where|wat |hoe |waarom |wanneer |comment|pourquoi|quand)/i.test(m)) {
    return "clarification";
  }

  return "general";
}

/** Selects tone from intent + urgency. Donor: Verinox tone profiles, simplified. */
export function selectTone(intent: NeoIntent): NeoTone {
  switch (intent) {
    case "urgency_signal":
      return "calm_reassuring";
    case "contact_request":
    case "out_of_scope":
      return "clear_direct";
    case "greeting":
    case "scope_question":
    case "office_question":
    case "lawyer_question":
    case "privacy_question":
    case "document_question":
    case "clarification":
    case "general":
    default:
      return "professional_empathetic";
  }
}

/** True urgency check (pattern donor: NEO v7.0 risk-aware path). */
export function isUrgent(message: string): boolean {
  return detectIntent(message) === "urgency_signal";
}

/**
 * Localized one-line "what NEO is" framing. Used in the bubble preface so
 * users know the assistant's boundary up front (donor: NEO v7.0 prime
 * directive paragraph, scoped to law firm orientation).
 */
export function neoBoundaryLine(locale: "en" | "nl" | "fr"): string {
  switch (locale) {
    case "nl":
      return "NEO geeft algemene oriëntatie op basis van het gepubliceerde materiaal van Orechdin. Geen juridisch advies.";
    case "fr":
      return "NEO fournit une orientation générale basée sur le matériel publié d'Orechdin. Pas de conseil juridique.";
    case "en":
    default:
      return "NEO offers general orientation grounded only in Orechdin's published material — not legal advice.";
  }
}

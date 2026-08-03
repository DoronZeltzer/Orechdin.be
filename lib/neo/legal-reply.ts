/**
 * Structured legal-orientation reply builder.
 *
 * Donor patterns (style only, no facts copied):
 * - Verinox `agent-21-legal-advisor`  → sectioned, disclaimer-aware output
 * - Verinox `agent-26-customer-support` → empathetic acknowledgement + next step
 * - Verinox NEO v7.0 prime directive → never invent; route to verified material
 *
 * Single source of truth: `lib/site.ts` + `data/neo-kb.json`. Nothing else.
 */

import { SITE, LAWYERS } from "@/lib/site";
import type { KbEntry } from "./types";
import {
  type NeoIntent,
  type NeoTone,
  TONE_PROFILES,
  neoBoundaryLine,
  isDateOrTimeQuestion,
  isGeneralKnowledgeQuestion,
} from "./communication";

export type Locale = "en" | "nl" | "fr";

export interface SuggestedFollowUp {
  id: string;
  label: string;
  /** What the chip should send back as the next user message. */
  prompt: string;
}

export interface LegalReplyParts {
  /** Empathetic acknowledgement, tone-aware. */
  opener: string;
  /** Bridge sentence introducing the grounded body. */
  bridge: string;
  /** KB-grounded factual core. May span 1–3 short paragraphs. */
  body: string;
  /** Soft boundary line (always present, never legal advice). */
  boundary: string;
  /** Recommended next step (call / page / email — only when relevant). */
  nextStep?: string;
  /** Required disclaimer when factual claims are made. */
  disclaimer?: string;
}

const DISCLAIMER: Record<Locale, string> = {
  en: SITE.disclaimer,
  nl: "Disclaimer: Orechdin Advocatenkantoor verbindt zich niet aan een specifiek resultaat, maar zal alle inspanningen leveren om het best mogelijke resultaat te bereiken.",
  fr: "Avertissement : le cabinet Orechdin ne s'engage à aucun résultat spécifique, mais mettra tout en œuvre pour obtenir le meilleur résultat possible.",
};

const NEXT_STEP_LABELS: Record<Locale, { contact: string; lawyers: string; services: string; privacy: string }> = {
  en: { contact: "Contact the office", lawyers: "See the lawyers", services: "See practice areas", privacy: "Open the privacy statement" },
  nl: { contact: "Neem contact op met het kantoor", lawyers: "Bekijk de advocaten", services: "Bekijk de praktijkdomeinen", privacy: "Open de privacyverklaring" },
  fr: { contact: "Contacter le cabinet", lawyers: "Voir les avocats", services: "Voir les domaines de pratique", privacy: "Ouvrir la déclaration de confidentialité" },
};

function formatToday(locale: Locale): string {
  const tag = locale === "nl" ? "nl-BE" : locale === "fr" ? "fr-BE" : "en-GB";
  return new Date().toLocaleDateString(tag, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function asksAboutWeather(message: string): boolean {
  return /(weather|weer|météo|forecast|temperature|rain|snow|sunny)/i.test(message || "");
}

/** Public-info contact line, only emitted when intent explicitly asks. */
export function publicContactLine(locale: Locale): string {
  const phone = SITE.phoneDisplay;
  const email = SITE.email;
  const addr = SITE.address.singleLine;
  switch (locale) {
    case "nl":
      return `Algemeen kantoor: ${phone} · ${email} · ${addr}.`;
    case "fr":
      return `Ligne générale du cabinet : ${phone} · ${email} · ${addr}.`;
    default:
      return `Office line: ${phone} · ${email} · ${addr}.`;
  }
}

/**
 * Build the structured reply parts. The composer joins them into a final
 * markdown-friendly string for the bubble.
 */
export function buildLegalReply(args: {
  intent: NeoIntent;
  tone: NeoTone;
  locale: Locale;
  hits: KbEntry[];
  routedAgent: string;
  message?: string;
}): LegalReplyParts {
  const { intent, tone, locale, hits, routedAgent, message = "" } = args;
  const profile = TONE_PROFILES[tone];

  let opener = profile.opener[locale];
  let bridge = profile.bridge[locale];

  const lead = hits[0];
  const support = hits.slice(1, 3);

  let body: string;

  if (intent === "greeting") {
    opener =
      locale === "nl"
        ? "Hallo — fijn dat u er bent."
        : locale === "fr"
          ? "Bonjour — ravi de vous accueillir."
          : "Hello — good to have you here.";
    bridge =
      locale === "nl"
        ? "Ik ben **NEO**, orientatie-assistent van Orechdin. Geen juridisch advies, wel feiten uit het gepubliceerde materiaal:"
        : locale === "fr"
          ? "Je suis **NEO**, assistant d'orientation d'Orechdin. Pas de conseil juridique — seulement des faits publiés :"
          : "I'm **NEO**, Orechdin's orientation assistant — not legal advice, but facts from published material:";

    const welcome =
      locale === "nl"
        ? "Waarmee kan ik u helpen? Praktijkgebieden, het team, contactgegevens — stel gerust uw vraag."
        : locale === "fr"
          ? "Comment puis-je vous aider ? Domaines de pratique, l'équipe, coordonnées — posez votre question."
          : "How can I help? Practice areas, the team, contact details — just ask.";

    if (lead) {
      body = `${welcome}\n\n**${lead.title}** — ${lead.body}`;
      if (support.length > 0) {
        body += "\n\n" + support.map((h) => `· _${h.title}_ — ${h.body}`).join("\n");
      }
    } else {
      body = welcome;
    }
  } else if (intent === "out_of_scope" && isGeneralKnowledgeQuestion(message)) {
    opener =
      locale === "nl"
        ? "Goede vraag — maar dat valt buiten wat ik kan doen."
        : locale === "fr"
          ? "Bonne question — mais cela dépasse ce que je peux faire."
          : "Fair question — but that's outside what I can do.";
    bridge =
      locale === "nl"
        ? "NEO is geen algemene chatbot. Dit kan ik wel zeggen:"
        : locale === "fr"
          ? "NEO n'est pas un chatbot généraliste. Voici ce que je peux dire :"
          : "NEO is not a general chatbot. Here's what I can say:";

    const parts: string[] = [];
    if (isDateOrTimeQuestion(message)) {
      parts.push(
        locale === "nl"
          ? `Vandaag is het **${formatToday(locale)}**.`
          : locale === "fr"
            ? `Aujourd'hui, nous sommes **${formatToday(locale)}**.`
            : `Today is **${formatToday(locale)}**.`,
      );
    }
    if (asksAboutWeather(message)) {
      parts.push(
        locale === "nl"
          ? "Ik heb geen live weerdata. Voor actueel weer in Antwerpen raadpleegt u best een weer-app of nieuwssite."
          : locale === "fr"
            ? "Je n'ai pas de données météo en direct. Pour Anvers, consultez une application météo ou un site d'actualités."
            : "I don't have live weather data. For Antwerp, check a weather app or news site.",
      );
    }
    parts.push(
      locale === "nl"
        ? "NEO helpt enkel met **juridische oriëntatie** rond Orechdin — praktijkgebieden, team, contact en privacy."
        : locale === "fr"
          ? "NEO aide uniquement à l'**orientation juridique** autour d'Orechdin — domaines, équipe, contact et confidentialité."
          : "NEO only helps with **legal orientation** around Orechdin — practice areas, team, contact, and privacy.",
    );
    body = parts.join("\n\n");
  } else if (lead) {
    body = `**${lead.title}** — ${lead.body}`;
    if (support.length > 0) {
      body += "\n\n" + support.map((h) => `· _${h.title}_ — ${h.body}`).join("\n");
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
    nextStep = locale === "nl"
      ? `Voor tijdgevoelige zaken: bel het kantoor op ${SITE.phoneDisplay}.`
      : locale === "fr"
        ? `Pour les affaires urgentes : appelez le cabinet au ${SITE.phoneDisplay}.`
        : `For time-sensitive matters, call the office at ${SITE.phoneDisplay}.`;
  } else if (intent === "out_of_scope") {
    if (/(antwerp|antwerpen|anvers)/i.test(message)) {
      nextStep =
        locale === "nl"
          ? `Het kantoor ligt in het centrum van Antwerpen: ${SITE.address.singleLine}.`
          : locale === "fr"
            ? `Le cabinet est situé au centre d'Anvers : ${SITE.address.singleLine}.`
            : `The office is in central Antwerp: ${SITE.address.singleLine}.`;
    } else {
      nextStep =
        locale === "nl"
          ? "NEO blijft binnen het gepubliceerde materiaal van Orechdin. Voor andere rechtsgebieden raadpleegt u best een advocaat in dat domein."
          : locale === "fr"
            ? "NEO reste dans le cadre du matériel publié par Orechdin. Pour d'autres domaines, il est préférable de consulter un avocat spécialisé."
            : "NEO stays within Orechdin's published material. For other jurisdictions or fields, please consult a specialist lawyer in that area.";
    }
  } else if (lead?.href) {
    nextStep = locale === "nl"
      ? `Vervolgstap: open ${routeLabel(lead.href, locale)}.`
      : locale === "fr"
        ? `Étape suivante : ouvrez ${routeLabel(lead.href, locale)}.`
        : `Next step: open ${routeLabel(lead.href, locale)}.`;
  }

  // Disclaimer only when factual claims are made (i.e. we had at least one KB hit).
  const disclaimer = lead && intent !== "greeting" && intent !== "out_of_scope" ? DISCLAIMER[locale] : undefined;

  // Mark routedAgent unused warning — keep available for future expansion.
  void routedAgent;

  return { opener, bridge, body, boundary, nextStep, disclaimer };
}

function routeLabel(href: string, locale: Locale): string {
  const labels = NEXT_STEP_LABELS[locale];
  if (href.includes("/contact")) return labels.contact;
  if (href.includes("/lawyers")) return labels.lawyers;
  if (href.includes("/services")) return labels.services;
  if (href.includes("/privacy")) return labels.privacy;
  return href;
}

/** Compose all parts into a single markdown-friendly bubble string. */
export function renderLegalReply(parts: LegalReplyParts): string {
  const out = [parts.opener, parts.bridge, "", parts.body];
  if (parts.nextStep) out.push("", `→ ${parts.nextStep}`);
  out.push("", `_${parts.boundary}_`);
  if (parts.disclaimer) out.push("", `> ${parts.disclaimer}`);
  return out.filter(Boolean).join("\n");
}

/**
 * Two to three contextual follow-ups, derived from intent + KB hits + lawyers.
 * No invented topics — every chip maps to either a published practice area
 * or a verified people/contact node.
 */
export function suggestFollowUps(args: {
  intent: NeoIntent;
  hits: KbEntry[];
  routedAgent: string;
  locale: Locale;
}): SuggestedFollowUp[] {
  const { intent, hits, locale } = args;
  const out: SuggestedFollowUp[] = [];

  const seen = new Set<string>();
  const add = (id: string, label: string, prompt: string) => {
    if (seen.has(id) || out.length >= 3) return;
    seen.add(id);
    out.push({ id, label, prompt });
  };

  // 1. KB-driven follow-ups (one per supporting hit)
  for (const h of hits.slice(1, 3)) {
    const label = h.title.length > 38 ? h.title.slice(0, 35) + "…" : h.title;
    const prompt = locale === "nl"
      ? `Vertel mij meer over: ${h.title}`
      : locale === "fr"
        ? `Dites-m'en plus sur : ${h.title}`
        : `Tell me more about: ${h.title}`;
    add(`kb-${h.id}`, label, prompt);
  }

  // 2. Intent-driven follow-ups (always grounded in published facts)
  if (intent === "greeting") {
    add(
      "publish-areas",
      locale === "nl" ? "Welke domeinen?" : locale === "fr" ? "Quels domaines ?" : "Which practice areas?",
      locale === "nl"
        ? "Welke praktijkdomeinen publiceert het kantoor?"
        : locale === "fr"
          ? "Quels domaines de pratique le cabinet publie-t-il ?"
          : "Which practice areas does the office publish?",
    );
    add(
      "lawyer-list",
      locale === "nl" ? "Wie zijn de advocaten?" : locale === "fr" ? "Qui sont les avocats ?" : "Who are the lawyers?",
      locale === "nl"
        ? "Wie zijn de advocaten en welke gebieden behandelen zij?"
        : locale === "fr"
          ? "Qui sont les avocats et quels domaines couvrent-ils ?"
          : "Who are the lawyers and which areas do they cover?",
    );
  }

  if (intent === "scope_question" || intent === "general" || intent === "clarification") {
    add(
      "lawyer-list",
      locale === "nl" ? "Wie zijn de advocaten?" : locale === "fr" ? "Qui sont les avocats ?" : "Who are the lawyers?",
      locale === "nl"
        ? "Wie zijn de advocaten en welke gebieden behandelen zij?"
        : locale === "fr"
          ? "Qui sont les avocats et quels domaines couvrent-ils ?"
          : "Who are the lawyers and which areas do they cover?",
    );
  }

  if (intent === "office_question" || intent === "scope_question") {
    add(
      "publish-areas",
      locale === "nl" ? "Welke domeinen?" : locale === "fr" ? "Quels domaines ?" : "Which practice areas?",
      locale === "nl"
        ? "Welke praktijkdomeinen publiceert het kantoor?"
        : locale === "fr"
          ? "Quels domaines de pratique le cabinet publie-t-il ?"
          : "Which practice areas does the office publish?",
    );
  }

  if (intent === "urgency_signal" || intent === "contact_request") {
    add(
      "ask-contact",
      locale === "nl" ? "Hoe bereik ik het kantoor?" : locale === "fr" ? "Comment joindre le cabinet ?" : "How do I reach the office?",
      locale === "nl"
        ? "Geef mij de gepubliceerde contactgegevens van het kantoor."
        : locale === "fr"
          ? "Donnez-moi les coordonnées publiées du cabinet."
          : "Give me the office's published contact details.",
    );
  }

  if (intent === "privacy_question") {
    add(
      "dpo",
      locale === "nl" ? "Wie is de DPO?" : locale === "fr" ? "Qui est le DPO ?" : "Who is the DPO?",
      locale === "nl"
        ? "Wie is de DPO en hoe oefen ik mijn rechten uit?"
        : locale === "fr"
          ? "Qui est le DPO et comment exercer mes droits ?"
          : "Who is the DPO and how do I exercise my rights?",
    );
  }

  // 3. Always offer a human handoff if room remains
  add(
    "ask-human",
    locale === "nl" ? "Spreek met een advocaat" : locale === "fr" ? "Parler à un avocat" : "Speak with a lawyer",
    locale === "nl"
      ? "Hoe kan ik rechtstreeks met een advocaat spreken?"
      : locale === "fr"
        ? "Comment parler directement à un avocat ?"
        : "How can I speak directly with a lawyer?",
  );

  // Avoid an empty array — fallback chip
  if (out.length === 0) {
    add(
      "what-can-you-do",
      locale === "nl" ? "Wat kan jij doen?" : locale === "fr" ? "Que peux-tu faire ?" : "What can you help with?",
      locale === "nl"
        ? "Wat kan jij doen voor mij?"
        : locale === "fr"
          ? "Que peux-tu faire pour moi ?"
          : "What can you help me with?",
    );
  }

  // Reference the lawyers list to show name-grounding (no roles invented).
  void LAWYERS;

  return out.slice(0, 3);
}

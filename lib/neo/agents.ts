import type { NeoAgent, NeoAgentId } from "./types";

/**
 * Swarm orchestrator roles - order matters for Auto routing (first keyword match wins).
 * Adapted from 13.NWP NEO swarm panel + Orechdin legal-office routing.
 */
export const NEO_AGENTS: NeoAgent[] = [
  {
    id: "contact-router",
    label: "Intake / Contact Router",
    shortLabel: "Contact",
    description:
      "Published phone, email, and address - use when the visitor wants to reach a human or book time.",
    tier: "routing",
    keywords: [
      "call",
      "phone",
      "telephone",
      "email",
      "e-mail",
      "mail ",
      "address",
      "visit",
      "reach",
      "contact",
      "appointment",
      "instruct",
      "mobile",
      "tel",
    ],
  },
  {
    id: "policy-helper",
    label: "Privacy / Policy guide",
    shortLabel: "Privacy",
    description:
      "GDPR-oriented pointers and links to the published privacy statement - not personal legal advice.",
    tier: "reference",
    keywords: ["privacy", "gdpr", "avg", "data", "cookies", "rights", "dpo"],
  },
  {
    id: "office-navigator",
    label: "Office Navigator",
    shortLabel: "Office",
    description:
      "Who works at Orechdin, how files are supervised, and how the office describes its approach.",
    tier: "routing",
    keywords: [
      "office",
      "team",
      "lawyer",
      "nir",
      "deborah",
      "antwerp",
      "location",
      "about",
    ],
  },
  {
    id: "document-helper",
    label: "Document Helper",
    shortLabel: "Documents",
    description:
      "Explains boundaries for contracts and documents - substantive review stays with the firm.",
    tier: "orientation",
    keywords: ["contract", "document", "paper", "sign", "review", "upload"],
  },
  {
    id: "services-guide",
    label: "Services Guide",
    shortLabel: "Services",
    description:
      "Maps questions to the practice areas and matter types the office publishes - no invented specialisations.",
    tier: "orientation",
    keywords: [
      "service",
      "services",
      "practice",
      "commercial",
      "criminal",
      "civil",
      "family",
      "employment",
      "traffic",
      "real estate",
      "property",
      "rental",
      "debt",
      "collection",
      "liability",
    ],
  },
  {
    id: "knowledge-finder",
    label: "KB Finder",
    shortLabel: "KB",
    description:
      "Prioritises approved knowledge-base articles and site links for verification.",
    tier: "reference",
    keywords: ["search", "find", "kb", "knowledge", "lookup", "where is"],
  },
  {
    id: "intake-assistant",
    label: "Intake Assistant",
    shortLabel: "Intake",
    description:
      "Helps frame a question safely before you speak with a lawyer - no case-specific conclusions.",
    tier: "routing",
    keywords: [
      "help",
      "problem",
      "urgent",
      "first step",
      "new client",
      "not sure",
    ],
  },
  {
    id: "strategic-advisor",
    label: "Strategic Advisor",
    shortLabel: "Strategy",
    description:
      "Maps dispute-resolution pathways (ADR, negotiation, settlement) and corporate-risk orientation - never recommends a specific strategy.",
    tier: "orientation",
    keywords: [
      "strategy",
      "negotiate",
      "negotiation",
      "mediation",
      "settlement",
      "arbitration",
      "adr",
      "risk",
      "director",
      "shareholder",
    ],
  },
  {
    id: "legal-analyst",
    label: "Legal Analyst",
    shortLabel: "Analysis",
    description:
      "Provides analytical orientation on complex legal structures, contractual mechanisms, and evidentiary frameworks - conclusions reserved for a qualified lawyer.",
    tier: "orientation",
    keywords: [
      "analysis",
      "analyse",
      "breach",
      "damages",
      "quantum",
      "enforcement",
      "liability",
      "zoning",
      "transaction",
      "evidence",
      "metacogniti",
      "comparative",
    ],
  },
  {
    id: "urgency-triage",
    label: "Urgency Triage",
    shortLabel: "Urgent",
    description:
      "Handles time-sensitive inquiries involving prescription periods, court deadlines, and hearings - always routes to the office for definitive dates.",
    tier: "routing",
    keywords: [
      "deadline",
      "verjaring",
      "prescription",
      "statute of limitations",
      "summons",
      "dagvaarding",
      "hearing",
      "zitting",
      "time limit",
      "expiry",
    ],
  },
  {
    id: "cross-border-strategist",
    label: "Cross-Border Strategist",
    shortLabel: "Cross-Border",
    description:
      "Handles international disputes, jurisdictional mechanisms (Rome I/II, Brussels I bis), and cross-border enforcement.",
    tier: "orientation",
    keywords: [
      "cross-border",
      "international",
      "jurisdiction",
      "foreign",
      "abroad",
      "enforcement",
      "treaty",
      "exequatur"
    ],
  },
  {
    id: "financial-modeler",
    label: "Financial Modeler",
    shortLabel: "Financial",
    description:
      "Analyzes complex damages, quantum structures, executive compensation, and insolvency mechanisms.",
    tier: "orientation",
    keywords: [
      "financial",
      "quantum",
      "damages",
      "compensation",
      "insolvency",
      "bankruptcy",
      "severance",
      "parachute"
    ],
  },
  {
    id: "legal-guide",
    label: "Lawyer Guide",
    shortLabel: "Guide",
    description:
      "High-level orientation on procedures and legal context - not a substitute for a qualified lawyer.",
    tier: "orientation",
    keywords: [
      "law",
      "legal",
      "court",
      "procedure",
      "rights",
      "claim",
      "lawsuit",
      "judge",
    ],
  },
];

export function agentById(id: NeoAgentId): NeoAgent | undefined {
  if (id === "auto") return undefined;
  return NEO_AGENTS.find((a) => a.id === id);
}

/** Auto-route: first keyword hit in NEO_AGENTS order; else lawyer guide. */
export function routeAgent(text: string): Exclude<NeoAgentId, "auto"> {
  const q = text.toLowerCase();
  for (const agent of NEO_AGENTS) {
    if (agent.keywords.some((k) => q.includes(k))) return agent.id;
  }
  return "legal-guide";
}

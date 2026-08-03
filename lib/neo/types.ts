export interface KbEntry {
  id: string;
  title: string;
  tags: string[];
  body: string;
  href: string | null;
  primaryAgent: string;
}

export type NeoAgentId =
  | "auto"
  | "legal-guide"
  | "services-guide"
  | "office-navigator"
  | "document-helper"
  | "knowledge-finder"
  | "intake-assistant"
  | "contact-router"
  | "policy-helper"
  | "strategic-advisor"
  | "legal-analyst"
  | "urgency-triage"
  | "cross-border-strategist"
  | "financial-modeler";

export type NeoTier = "orientation" | "routing" | "reference";

export interface NeoAgent {
  id: Exclude<NeoAgentId, "auto">;
  label: string;
  shortLabel: string;
  description: string;
  tier: NeoTier;
  keywords: string[];
}

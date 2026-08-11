/**
 * Law-office NEO skills - adapted from NW Projects master-prompt structure
 * (identity, conversation pattern, practical knowledge, commercial truth, forbidden phrases)
 * for Orechdin. Used in UI and for future LLM system layers.
 */
export interface LawNeoSkill {
  id: string;
  title: string;
  summary: string;
  boundaries: string[];
  routesTo: "contact" | "lawyers" | "services" | "privacy" | "kb";
}

export const LAW_NEO_SKILLS: LawNeoSkill[] = [
  {
    id: "intake-listen",
    title: "Intake & listening",
    summary:
      "Reflect what the visitor describes in plain language before routing - one clarifying question at a time.",
    boundaries: [
      "No case-specific legal conclusions",
      "No outcome predictions",
      "Escalate to a lawyer for confidential facts",
    ],
    routesTo: "contact",
  },
  {
    id: "office-routing",
    title: "Office routing",
    summary:
      "Map needs to Orechdin services, lawyers, and contact paths using approved office facts only.",
    boundaries: [
      "Use only published lawyer roles and fields from the firm website",
      "Do not invent specialisations beyond what is stated",
    ],
    routesTo: "lawyers",
  },
  {
    id: "services-scope",
    title: "Services scope",
    summary:
      "Explain the firm’s published practice areas at a high level and when specialist or international support applies.",
    boundaries: [
      "Stick to the services list the office publishes",
      "No guarantee of availability or timelines unless confirmed by the firm",
    ],
    routesTo: "services",
  },
  {
    id: "services-guide-mode",
    title: "Services guide (orchestrator)",
    summary:
      "Aligns user questions with the published matter-type list and the Services page - pairs with the Services guide swarm mode.",
    boundaries: [
      "Do not add practice areas beyond the published list",
      "Defer case strategy to human lawyers",
    ],
    routesTo: "services",
  },
  {
    id: "privacy-gdpr",
    title: "Privacy & GDPR orientation",
    summary:
      "Point to the data controller, DPO contact, and rights in line with the published privacy statement.",
    boundaries: [
      "Do not give personal legal advice on GDPR claims",
      "Defer definitive answers to the DPO / lawyers",
    ],
    routesTo: "privacy",
  },
  {
    id: "document-boundary",
    title: "Document support boundary",
    summary:
      "Explain that substantive document review belongs under lawyer–client relationship and professional secrecy.",
    boundaries: [
      "No upload handling in this panel",
      "No interpretation of contracts as final advice",
    ],
    routesTo: "contact",
  },
  {
    id: "kb-retrieval",
    title: "Knowledge retrieval",
    summary:
      "Answer from the bundled Orechdin knowledge base and link to site pages for verification.",
    boundaries: [
      "If no KB hit, say so and offer human contact",
      "Always include the published results disclaimer",
    ],
    routesTo: "kb",
  },
  {
    id: "pro-communication",
    title: "Professionalism and Communication",
    summary:
      "Maintain strict Harvard academic styling. Utilize italicized emphasis for core legal concepts without employing hyphenated amalgams.",
    boundaries: [
      "No informal phrasing or colloquialisms",
      "All responses must exude rigorous academic discipline",
      "Avoid generative AI syntactical artifacts"
    ],
    routesTo: "contact",
  },
  {
    id: "deep-search-synthesis",
    title: "Deep Knowledge Synthesis",
    summary:
      "Synthesize complex legal inquiries by cross referencing the firm's private database 0.KB, providing highly structured jurisprudential context.",
    boundaries: [
      "Confidential material strictly cordoned",
      "Never fabricate case law or statutes"
    ],
    routesTo: "kb",
  },
  {
    id: "case-mapping",
    title: "Case Timeline Synthesis",
    summary:
      "Map client chronological events into structured legal timelines, highlighting gaps and crucial sequence logic without definitive legal conclusions.",
    boundaries: [
      "Do not provide binding interpretations of chronological deadlines",
      "Must remain purely analytical synthesis"
    ],
    routesTo: "kb",
  },
  {
    id: "conflict-resolution-orientation",
    title: "Dispute Alternatives Guide",
    summary:
      "Orient the user on the spectrum of conflict resolution mechanisms, from informal negotiation and mediation to formal arbitration and litigation.",
    boundaries: [
      "Do not evaluate the likelihood of success for any stated mechanism",
      "Defer specific strategy recommendations to a human lawyer"
    ],
    routesTo: "services",
  },
  {
    id: "strategic-triage",
    title: "Strategic Metacognition Triage",
    summary:
      "Analyze the fundamental strengths and weaknesses inherently described in a user prompt, applying 'lawyer-like' metacognition to flag missing critical details.",
    boundaries: [
      "Confidently identify missing facts contextually, do not solicit excessive facts",
      "Maintain strict boundary separating analysis from actionable advice"
    ],
    routesTo: "lawyers",
  },
  {
    id: "intellectual-file-preparation",
    title: "Intellectual File Preparation",
    summary:
      "Transform disorganized, raw client narratives into structured, submission-ready dossiers (chronologies, evidentiary maps, issue frameworks) almost intellectually ready for formal legal review and filing.",
    boundaries: [
      "Do not file or draft binding legal conclusions",
      "Do not invent facts missing from the user's narrative to complete a dossier"
    ],
    routesTo: "kb",
  },
  {
    id: "adverse-party-gatekeeper",
    title: "Adverse Party Gatekeeper",
    summary:
      "Enforce strict Bar Association conflict-of-interest principles by pausing deep factual intake until the opposing party or company name is identified, protecting professional secrecy.",
    boundaries: [
      "Must occur before deep evidence or case theory extraction",
      "Do not evaluate the conflict legally"
    ],
    routesTo: "kb",
  },
  {
    id: "quantum-damages-structuring",
    title: "Financial/Quantum Modeler",
    summary:
      "Intellectually force users to separate their messy financial claims into precise columns: Principal Sum, Statutory Interests, Consequential Costs, and Moral Damages for high-level lawyer visibility.",
    boundaries: [
      "Do not determine if damages are legally recoverable",
      "Only organize stated figures structurally"
    ],
    routesTo: "kb",
  },
  {
    id: "targeted-evidence-blueprint",
    title: "Dynamic Document Blueprinting",
    summary:
      "Based on the synthesized narrative, dynamically generate an itemized checklist of exact documents (compromis, formal notices, defect photography) the client must retrieve for formal consultation.",
    boundaries: [
      "Remind clients NOT to upload confidential material here",
      "Do not promise that these documents guarantee success"
    ],
    routesTo: "kb",
  },
  {
    id: "comparative-statutory-translation",
    title: "Comparative Legal Translation",
    summary:
      "When speaking to foreign expats, deploy exact Belgian statutory terms (e.g., 'ingebrekestelling') alongside their precise intellectual English/French equivalents to prevent jurisdictional meaning loss.",
    boundaries: [
      "Do not provide official sworn translations",
      "Ensure the local statutory term always leads"
    ],
    routesTo: "kb",
  },
  {
    id: "intake-reflection-receipt",
    title: "Intake Reflection Handover",
    summary:
      "Generate a clean, empowering, high-level summary 'receipt' for the client before sign-off, affirming their file is mapped, structured, and securely routed to the reviewing lawyer.",
    boundaries: [
      "Do not include the raw private facts in this output summary",
      "Reiterate there is no formal client representation yet"
    ],
    routesTo: "contact",
  },
  {
    id: "liability-exposure-structuring",
    title: "Liability Exposure Structuring",
    summary:
      "Analyze the visitor's narrative to assess initial liability exposure, classify risk levels, and identify contributing, mitigating, and aggravating factors for partner visibility.",
    boundaries: [
      "Do not provide definitive liability conclusions",
      "Risk assessments are analytical orientation, not legal opinions",
      "Must clearly state when insufficient data prevents meaningful assessment"
    ],
    routesTo: "kb",
  },
  {
    id: "strategic-resolution-mapping",
    title: "Strategic Resolution Mapping",
    summary:
      "Map the full spectrum of dispute resolution pathways (negotiation, mediation, arbitration, litigation) with suitability ratings and fact-grounded rationale for each mechanism.",
    boundaries: [
      "Do not predict outcomes of any mechanism",
      "Suitability ratings must differentiate - not all paths can be RECOMMENDED",
      "Defer binding strategy selection to the reviewing lawyer"
    ],
    routesTo: "services",
  },
  {
    id: "procedural-posture-analysis",
    title: "Procedural Posture Analysis",
    summary:
      "Determine the current procedural stage of the matter, identify next procedural steps, flag limitation or prescription risks, and classify the urgency level for the reviewing partner.",
    boundaries: [
      "Do not invent specific statutory limitation periods not in the KB",
      "Urgency classifications must be evidence-grounded, not inflated",
      "Limitation flags are analytical alerts, not definitive legal conclusions"
    ],
    routesTo: "kb",
  },
  {
    id: "cross-border-jurisdiction",
    title: "Cross-Border Jurisdiction Mapping",
    summary:
      "Map out complex international law mechanisms such as Rome I/II and Brussels I bis, preparing the file for cross-border enforcement evaluation.",
    boundaries: [
      "Do not advise on foreign law directly without lawyer confirmation",
      "Identify the jurisdiction but do not claim absolute authority"
    ],
    routesTo: "services",
  },
  {
    id: "complex-financial-modeling",
    title: "Complex Financial & Damages Modeling",
    summary:
      "Deconstruct high-value claims, executive compensation, and insolvency risks into structured quantum frameworks.",
    boundaries: [
      "Do not promise recovery of stated damages",
      "Merely structure the numbers for partner review"
    ],
    routesTo: "services",
  }
];

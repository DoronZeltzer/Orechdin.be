/**
 * Light client-side conflict / sensitivity flag for the intake dossier.
 *
 * This is NOT a real conflict-of-interest check. It is a placeholder shape
 * that lets the dossier carry a few non-blocking signals to the lawyer's
 * desk so they can run the actual conflict check before opening the file.
 *
 * Rules:
 * - Never blocks submission.
 * - Never displays the firm's actual conflict list (that is private and
 *   lives lawyer-side).
 * - Just notes obvious risk surfaces (named opposing-party patterns,
 *   self-represented claims, off-jurisdiction hints) so the dossier
 *   header has something for the human reviewer to glance at.
 *
 * Sources of truth used:
 * - lib/site.ts (firm name, two named lawyers — never claim conflict
 *   with a name that resembles the firm's own).
 */

import { LAWYERS, SITE } from "@/lib/site";

export interface ConflictFlag {
  /** Stable id so the UI can dedupe / order. */
  id: string;
  severity: "INFO" | "WATCH" | "ATTENTION";
  /** Short, lawyer-readable label for the dossier header. */
  label: string;
  /** Why it fired — included verbatim in the dossier. */
  reason: string;
}

const FIRM_NAME_RX = new RegExp(`\\b(${SITE.shortName.replace(/[^a-z]/gi, "")}|${SITE.legalName.split(/[^a-z]/i)[0]})\\b`, "i");
const LAWYER_NAME_RX = new RegExp(
  `\\b(${LAWYERS.map((l) => l.name.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "i",
);

const OUT_OF_JURISDICTION_RX =
  /\b(united states|us federal|california|new york|texas|france only|paris court|tribunal de paris|netherlands court|amsterdam court|german court|deutschland gericht)\b/i;

const SELF_REP_RX = /\b(i represent myself|self[- ]represented|pro se|in persona|sans avocat|zonder advocaat)\b/i;

const SENSITIVE_DOMAIN_RX =
  /\b(asylum|asiel|asile|immigration tribunal|deportation|uitwijzing|expulsion|war crime|oorlogsmisdaad|crime de guerre|terrorism|terrorisme|child protection|kinderbescherming|protection de l['']enfance|domestic violence|huiselijk geweld|violence domestique|intrafamiliaal geweld|sexual assault|aanranding|agression sexuelle|mensenhandel|traite des êtres humains|trafficking)\b/i;

export function detectConflictFlags(args: { transcriptText: string; documentNames: string[] }): ConflictFlag[] {
  const text = `${args.transcriptText}\n${args.documentNames.join(" ")}`;
  const flags: ConflictFlag[] = [];

  if (FIRM_NAME_RX.test(text)) {
    flags.push({
      id: "firm-name-mention",
      severity: "ATTENTION",
      label: "Firm name appears in narrative",
      reason: "The visitor's text references the firm's own name. Verify it is not an opposing-party reference before opening the file.",
    });
  }

  if (LAWYER_NAME_RX.test(text)) {
    flags.push({
      id: "lawyer-name-mention",
      severity: "WATCH",
      label: "A firm lawyer's name appears in narrative",
      reason: "The visitor mentioned a lawyer working at the firm by name. Confirm the reference (existing file, witness, opposing-party).",
    });
  }

  if (OUT_OF_JURISDICTION_RX.test(text)) {
    flags.push({
      id: "out-of-jurisdiction",
      severity: "WATCH",
      label: "Possible out-of-jurisdiction matter",
      reason: "Wording suggests the matter may sit outside Belgian jurisdiction. Confirm before accepting representation.",
    });
  }

  if (SELF_REP_RX.test(text)) {
    flags.push({
      id: "self-represented",
      severity: "INFO",
      label: "Visitor mentions self-representation",
      reason: "Visitor stated they are currently self-represented. Confirm there is no concurrent counsel.",
    });
  }

  if (SENSITIVE_DOMAIN_RX.test(text)) {
    flags.push({
      id: "sensitive-domain",
      severity: "ATTENTION",
      label: "Sensitive subject matter mentioned",
      reason: "Topic touches a high-sensitivity domain. Apply the firm's sensitive-matter intake protocol.",
    });
  }

  return flags;
}

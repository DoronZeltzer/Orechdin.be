/**
 * `sendBrief` - adapter for delivering a generated case file to the firm.
 *
 * The real channel (IMAP, Microsoft Graph, internal CRM) is wired later.
 * Until then this adapter is intentionally a no-op stub gated by
 * `NEO_INTAKE_MODE`:
 *
 *   - off   → throws IntakeDisabledError, caller should not have shown the
 *             "Send brief" button in the first place.
 *   - demo  → console.warns the brief metadata + writes nothing, returns a
 *             demo reference id so the UI can show a confirmation flow.
 *   - live  → throws IntakeNotImplementedError until IMAP / Microsoft Graph
 *             is wired (one function swap, no other code changes).
 *
 * Keeping this in its own file means swapping channels later is one PR
 * touching one symbol.
 */

import { INTAKE_MODE } from "./intake-mode";
import type { CaseFile } from "./case-file-types";

export interface SendBriefInput {
  caseFile: CaseFile;
  /** PDF binary that will accompany the brief. */
  pdf: Uint8Array;
  /** DOCX binary that will accompany the brief. */
  docx: Uint8Array;
  /** Visitor's contact email, if collected. Optional in this version. */
  visitorEmail?: string;
}

export interface SendBriefResult {
  ok: boolean;
  mode: "off" | "demo" | "live";
  reference: string;
  message: string;
}

export class IntakeDisabledError extends Error {
  constructor() {
    super("NEO intake is disabled in this environment.");
    this.name = "IntakeDisabledError";
  }
}

export class IntakeChannelNotConfiguredError extends Error {
  constructor() {
    super(
      "NEO intake is in live mode but no delivery channel (IMAP / Microsoft Graph) is configured yet.",
    );
    this.name = "IntakeChannelNotConfiguredError";
  }
}

function makeReference(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export async function sendBrief(input: SendBriefInput): Promise<SendBriefResult> {
  const mode = INTAKE_MODE;

  if (mode === "off") {
    throw new IntakeDisabledError();
  }

  if (mode === "demo") {
    const reference = makeReference("DEMO");
    console.warn(
      `[NEO][demo] Would deliver brief ${reference} (${input.pdf.byteLength} B PDF, ${input.docx.byteLength} B DOCX) for matter ${input.caseFile.cover.matterId}` +
        (input.visitorEmail ? ` from ${input.visitorEmail}` : "") +
        `. No real delivery configured.`,
    );
    return {
      ok: true,
      mode: "demo",
      reference,
      message:
        "Demo: the brief was assembled but not delivered. The IMAP / Microsoft Graph channel is wired separately.",
    };
  }

  // mode === "live"
  throw new IntakeChannelNotConfiguredError();
}

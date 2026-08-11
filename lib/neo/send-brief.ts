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
import { sendMail, isMailerConfigured, firmIntakeAddress } from "./mailer";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

  // mode === "live" — deliver the assembled brief to the firm's inbox.
  if (!isMailerConfigured()) {
    throw new IntakeChannelNotConfiguredError();
  }

  const reference = makeReference("ORX");
  const cover = input.caseFile.cover;
  const to = firmIntakeAddress()!;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:2px 14px 2px 0;color:#5c6674">${label}</td><td style="color:#0a0a0a">${esc(value)}</td></tr>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a0a0a;line-height:1.5">
      <div style="height:3px;width:44px;background:#95b6df;margin-bottom:16px"></div>
      <h2 style="margin:0 0 4px;font-size:18px">New case intake</h2>
      <p style="margin:0 0 16px;color:#5c6674">Reference ${esc(reference)} · assembled by NEO from the visitor's own messages.</p>
      <table style="border-collapse:collapse">
        ${row("Matter", cover.caption)}
        ${row("Matter ID", cover.matterId)}
        ${input.visitorEmail ? row("Client contact", input.visitorEmail) : ""}
        ${cover.suggestedLead ? row("Suggested lead", cover.suggestedLead) : ""}
        ${cover.nextDeadline ? row("Next deadline", cover.nextDeadline) : ""}
        ${cover.statuteOfLimitationsAlert ? row("SOL alert", cover.statuteOfLimitationsAlert) : ""}
      </table>
      <p style="margin:16px 0 0;color:#5c6674">The full brief is attached as PDF and Word. Every fact carries a source pointer (Msg # / Doc:) so it can be verified in seconds.</p>
    </div>`;

  const text =
    `New case intake — reference ${reference}\n` +
    `Matter: ${cover.caption} [${cover.matterId}]\n` +
    (input.visitorEmail ? `Client contact: ${input.visitorEmail}\n` : "") +
    `Full brief attached as PDF and Word.`;

  const safeId = cover.matterId.replace(/[^a-zA-Z0-9_-]+/g, "_");
  await sendMail({
    to,
    subject: `New case intake: ${cover.caption} [${cover.matterId}]`,
    html,
    text,
    replyTo: input.visitorEmail,
    attachments: [
      { filename: `Case-${safeId}.pdf`, content: input.pdf, contentType: "application/pdf" },
      {
        filename: `Case-${safeId}.docx`,
        content: input.docx,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ],
  });

  return {
    ok: true,
    mode: "live",
    reference,
    message: "The brief was delivered to the office intake inbox.",
  };
}

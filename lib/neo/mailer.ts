import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound mail for the NEO intake channel.
 *
 * Provider-agnostic SMTP (nodemailer), driven entirely by environment
 * variables so the firm can point it at any mailbox (Office 365, Google
 * Workspace, a classic host) without a code change:
 *
 *   ORECHDIN_OUTBOX_HOST       e.g. smtp.office365.com
 *   ORECHDIN_OUTBOX_PORT       587 (STARTTLS) or 465 (implicit TLS)
 *   ORECHDIN_OUTBOX_USER       the mailbox login
 *   ORECHDIN_OUTBOX_PASSWORD   mailbox password / app password
 *   ORECHDIN_OUTBOX_FROM       display address on outgoing mail
 *   ORECHDIN_INTAKE_TO         where new-case briefs land (defaults to FROM)
 *
 * When the vars are absent the mailer reports "not configured" so callers
 * can fail loudly rather than silently drop a client's case.
 */

export interface MailAttachment {
  filename: string;
  content: Uint8Array | Buffer;
  contentType?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function mailerConfig() {
  const host = env("ORECHDIN_OUTBOX_HOST");
  const port = Number(env("ORECHDIN_OUTBOX_PORT") ?? "587");
  const user = env("ORECHDIN_OUTBOX_USER");
  const password = env("ORECHDIN_OUTBOX_PASSWORD");
  const from = env("ORECHDIN_OUTBOX_FROM") ?? user;
  const intakeTo = env("ORECHDIN_INTAKE_TO") ?? from;
  return { host, port, user, password, from, intakeTo };
}

export function isMailerConfigured(): boolean {
  const c = mailerConfig();
  return Boolean(c.host && c.user && c.password && c.from);
}

/** Recipient for new-case briefs (the firm's intake inbox). */
export function firmIntakeAddress(): string | undefined {
  return mailerConfig().intakeTo;
}

let cached: Transporter | null = null;

function transport(): Transporter {
  if (cached) return cached;
  const c = mailerConfig();
  if (!c.host || !c.user || !c.password) {
    throw new Error(
      "SMTP outbox is not configured (set ORECHDIN_OUTBOX_HOST / _USER / _PASSWORD).",
    );
  }
  cached = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: { user: c.user, pass: c.password },
  });
  return cached;
}

export async function sendMail(input: SendMailInput): Promise<{ messageId: string }> {
  const c = mailerConfig();
  const info = await transport().sendMail({
    from: c.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content),
      contentType: a.contentType,
    })),
  });
  return { messageId: info.messageId };
}

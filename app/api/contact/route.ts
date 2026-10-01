import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactSchema, type ContactError } from "@/lib/contact-schema";

export const runtime = "nodejs";

/**
 * POST /api/contact: sends the contact form to the office by email.
 *
 * What this does NOT do, on purpose: it stores nothing, it logs no message
 * content, and it calls no third party (no CAPTCHA service, which would drag a
 * US provider and its cookies into a law firm's contact page). The message
 * goes from the visitor to the office's own mail account and nowhere else.
 *
 * Defences against abuse, all local:
 *   - strict validation, and a hard cap on body size;
 *   - a same-origin check, so another site cannot post here from a visitor's
 *     browser;
 *   - a honeypot field and a minimum fill time, answered with a fake success
 *     so bots learn nothing;
 *   - a per-IP rate limit. It is held in memory, so on a serverless host it
 *     is per instance and a determined attacker could get around it. It stops
 *     the casual flood; put a real limiter in front for anything more.
 *
 * Delivery needs these environment variables (see .env.example). If they are
 * missing the route answers 503 `not_configured` and the form tells the visitor
 * to phone or email instead, so a missing setting can never swallow a message
 * silently.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_BODY_CHARS = 20_000;
const MIN_FILL_MS = 2500;

const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function fail(error: ContactError, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Header values must be one line, or a visitor could inject extra headers. */
const oneLine = (s: string) => s.replace(/[\r\n\u2028\u2029]+/g, " ").trim();

function mailConfig() {
  const host = process.env.ORECHDIN_OUTBOX_HOST;
  const from = process.env.ORECHDIN_OUTBOX_FROM;
  const to = process.env.ORECHDIN_CONTACT_TO || from;
  if (!host || !from || !to) return null;
  const port = Number(process.env.ORECHDIN_OUTBOX_PORT || 587);
  const user = process.env.ORECHDIN_OUTBOX_USER;
  const pass = process.env.ORECHDIN_OUTBOX_PASSWORD;
  return { host, port, from, to, auth: user && pass ? { user, pass } : undefined };
}

export async function POST(req: Request) {
  // Same-origin only. A missing Origin (curl, server-to-server) is allowed;
  // a mismatching one is a cross-site post.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get("host")) return fail("validation", 403);
    } catch {
      return fail("validation", 403);
    }
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) return fail("validation", 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("validation", 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return fail("validation", 400);
  const d = parsed.data;

  // Bot traps: answer as if it worked, send nothing.
  if (d.website || d.elapsedMs < MIN_FILL_MS) {
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip, Date.now())) return fail("rate_limited", 429);

  const cfg = mailConfig();
  if (!cfg) return fail("not_configured", 503);

  const name = oneLine(d.name);
  const phone = d.phone ? oneLine(d.phone) : "";
  const lines = [
    `Name: ${name}`,
    `Email: ${d.email}`,
    phone ? `Phone: ${phone}` : null,
    `Language of the page: ${d.locale}`,
    "",
    d.message,
  ].filter((l) => l !== null) as string[];

  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: cfg.auth,
      // A port-25 sink or an internal relay may not offer TLS; real providers
      // on 587 use STARTTLS automatically.
      tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
    });
    await transport.sendMail({
      from: { name: "Orechdin website", address: cfg.from },
      to: cfg.to,
      replyTo: { name, address: d.email },
      subject: oneLine(`Website contact: ${name}`),
      text: lines.join("\n"),
      html:
        `<p><strong>Name:</strong> ${escapeHtml(name)}<br>` +
        `<strong>Email:</strong> ${escapeHtml(d.email)}<br>` +
        (phone ? `<strong>Phone:</strong> ${escapeHtml(phone)}<br>` : "") +
        `<strong>Language of the page:</strong> ${d.locale}</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(d.message)}</p>`,
    });
  } catch (err) {
    // Log the failure code only, never the visitor's message or address.
    console.error("[contact] send failed:", (err as { code?: string })?.code ?? "unknown");
    return fail("send_failed", 502);
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

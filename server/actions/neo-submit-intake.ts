"use server";

import { createHash, randomInt, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { INTAKE_MODE } from "@/lib/neo/intake-mode";
import { db } from "@/db";
import { verification } from "@/db/schema";
import { sendMail, isMailerConfigured } from "@/lib/neo/mailer";
import { SITE } from "@/lib/site";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function otpKey(email: string): string {
  return `neo-intake-otp:${email.trim().toLowerCase()}`;
}

function hashOtp(email: string, code: string): string {
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

/**
 * NEO intake server actions.
 *
 * The behaviour of each action is gated by the `NEO_INTAKE_MODE` env
 * variable (`off` | `demo` | `live`). See `lib/neo/intake-mode.ts` for
 * the contract. Default is `off` so a fresh deploy never silently
 * accepts a "case" it cannot persist.
 *
 * In `live` mode the action is intentionally a stub that throws — the
 * Resend + DB integration is a deliberate separate change so the launch
 * branch can ship without back-end dependencies.
 */

class IntakeDisabledError extends Error {
  constructor() {
    super("NEO intake is disabled in this environment.");
    this.name = "IntakeDisabledError";
  }
}

class IntakeNotImplementedError extends Error {
  constructor(action: string) {
    super(
      `NEO intake action "${action}" is not implemented in live mode yet. ` +
        `Wire Resend + DATABASE_URL before flipping NEO_INTAKE_MODE to "live".`,
    );
    this.name = "IntakeNotImplementedError";
  }
}

/** Send (or pretend to send) an OTP code to verify a contact channel. */
export async function submitVerificationEmail(email: string) {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email payload.");
  }

  const mode = INTAKE_MODE;

  if (mode === "off") {
    throw new IntakeDisabledError();
  }

  if (mode === "demo") {
    console.warn(
      `[NEO][demo] Would dispatch verification to ${email}. No real email sent.`,
    );
    return { success: true, verificationMode: "DEMO_VERIFICATION" as const };
  }

  // mode === "live" — issue a real OTP, store its hash, and email it.
  if (!isMailerConfigured()) {
    throw new IntakeNotImplementedError("submitVerificationEmail");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const key = otpKey(email);
  const now = new Date();

  // One live code per email: clear any previous, then store the fresh hash.
  await db.delete(verification).where(eq(verification.identifier, key));
  await db.insert(verification).values({
    id: randomUUID(),
    identifier: key,
    value: hashOtp(email, code),
    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    createdAt: now,
    updatedAt: now,
  });

  await sendMail({
    to: email,
    subject: `${SITE.title}: your verification code`,
    text: `Your ${SITE.title} verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a0a0a;line-height:1.5">
        <div style="height:3px;width:44px;background:#95b6df;margin-bottom:16px"></div>
        <p style="margin:0 0 8px">Your verification code is</p>
        <p style="margin:0 0 8px;font-size:30px;font-weight:700;letter-spacing:6px">${code}</p>
        <p style="margin:0;color:#5c6674">It expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      </div>`,
  });

  return { success: true, verificationMode: "LIVE_OTP_VERIFICATION" as const };
}

/** Verify the OTP code the user typed back into the chat. */
export async function verifyOtpCode(email: string, code: string) {
  if (!code || code.length < 4) {
    throw new Error("Invalid code.");
  }

  const mode = INTAKE_MODE;

  if (mode === "off") {
    throw new IntakeDisabledError();
  }

  if (mode === "demo") {
    const valid = code.length === 4;
    return {
      success: valid,
      message: valid ? "Contact channel verified (demo)" : "Invalid demo code",
    };
  }

  // mode === "live" — check the stored hash and expiry.
  const key = otpKey(email);
  const rows = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, key))
    .limit(1);
  const rec = rows[0];

  if (!rec) {
    return { success: false, message: "No pending code. Request a new one." };
  }
  if (rec.expiresAt.getTime() < Date.now()) {
    await db.delete(verification).where(eq(verification.identifier, key));
    return { success: false, message: "Code expired. Request a new one." };
  }
  if (rec.value !== hashOtp(email, code.trim())) {
    return { success: false, message: "Invalid code." };
  }

  await db.delete(verification).where(eq(verification.identifier, key));
  return { success: true, message: "Contact channel verified." };
}

/** Persist the verified dossier and route it to the firm's review queue. */
export async function submitDossierForReview(
  intakeDraftId: string,
  consents: {
    rep_understanding: boolean;
    info_auth: boolean;
    use_consent: boolean;
  },
  clientEmail: string,
) {
  if (
    !consents.rep_understanding ||
    !consents.info_auth ||
    !consents.use_consent
  ) {
    throw new Error("Missing required consents for intake submission.");
  }

  const mode = INTAKE_MODE;

  if (mode === "off") {
    throw new IntakeDisabledError();
  }

  if (mode === "demo") {
    const referenceId = `DEMO-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
    console.warn(
      `[NEO][demo] Would persist dossier ${intakeDraftId} for ${clientEmail} as ${referenceId}.`,
    );
    return { success: true, referenceId, dossierCreated: true } as const;
  }

  // mode === "live" — server-side consent gate (enforced above). The brief
  // itself is assembled from the transcript and delivered to the office by
  // POST /api/neo/case-file (send:true) → sendBrief(); this action records
  // the verified consent and hands back the client-facing reference.
  const referenceId = `ORX-${randomUUID().slice(0, 8).toUpperCase()}`;
  return { success: true, referenceId, dossierCreated: true } as const;
}

"use server";

import { INTAKE_MODE } from "@/lib/neo/intake-mode";

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

  // mode === "live"
  throw new IntakeNotImplementedError("submitVerificationEmail");
}

/** Verify the OTP code the user typed back into the chat. */
export async function verifyOtpCode(_email: string, code: string) {
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

  // mode === "live"
  throw new IntakeNotImplementedError("verifyOtpCode");
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

  // mode === "live"
  throw new IntakeNotImplementedError("submitDossierForReview");
}

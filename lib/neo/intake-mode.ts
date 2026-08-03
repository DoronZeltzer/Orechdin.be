/**
 * Single source of truth for whether the NEO assistant accepts a real
 * client intake (email OTP + persisted dossier) or runs in answers-only
 * mode.
 *
 * Set `NEXT_PUBLIC_NEO_INTAKE_MODE` in the environment:
 *   - "off"  (default)  Production-safe. The chat answers questions but
 *                       does not collect verifiable client identity, does
 *                       not send OTP emails, and does not persist
 *                       submissions. Use this until Resend + a real DB
 *                       are wired in.
 *   - "demo"            Walk-through mode for sales / pitch demos.
 *                       Accepts any 4-character OTP, writes to local
 *                       SQLite if configured, and clearly labels itself
 *                       as demo.
 *   - "live"            Real OTP via Resend, real dossier persistence.
 *                       Requires RESEND_API_KEY + a hosted DATABASE_URL.
 *
 * Defaulting to "off" means a forgotten env var on a fresh deploy can
 * never silently lose a real client's case.
 *
 * The variable is `NEXT_PUBLIC_*` so the same value is available on the
 * server (gating the actions) AND in the client bundle (gating the
 * intake UI). Without a public mirror, dead code-paths would still ship
 * to the browser.
 */
export type IntakeMode = "off" | "demo" | "live";

export const INTAKE_MODE: IntakeMode = (() => {
  const raw = (process.env.NEXT_PUBLIC_NEO_INTAKE_MODE ?? "off")
    .trim()
    .toLowerCase();
  if (raw === "demo" || raw === "live") return raw;
  return "off";
})();

export const INTAKE_ENABLED: boolean = INTAKE_MODE !== "off";

/**
 * Public banner copy keyed by mode. Surfaced in the chat header so the
 * lawyer (and any client poking around) can always see what tier of
 * intake they are looking at.
 */
export const INTAKE_MODE_LABEL: Record<IntakeMode, string | null> = {
  off: null,
  demo: "Demo mode — no email is sent and no case is persisted",
  live: null,
};

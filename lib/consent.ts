/**
 * Cookie-consent model for orechdin.be.
 *
 * Belgian frame of reference: Article 129 of the Electronic Communications
 * Act (which transposes the ePrivacy Directive) plus the GDPR consent bar.
 * The practical consequences that shaped this module:
 *
 *   1. Consent must be PRIOR. Nothing outside `necessary` may touch the
 *      visitor's terminal equipment before an explicit choice exists, so the
 *      default state below is "everything optional is off".
 *   2. Refusal must be as easy as acceptance, and closing the banner must
 *      leave the visitor in the refused state — hence there is no "dismissed
 *      but undecided" value that silently reads as consent.
 *   3. Consent must be withdrawable and must expire. The GBA expects a
 *      consent record to live for roughly six months, after which the visitor
 *      is asked again; `CONSENT_MAX_AGE_SECONDS` encodes that.
 *   4. Consent must be versioned, so that adding a category or a vendor
 *      re-opens the question instead of inheriting a stale "yes".
 *
 * Storage is a first-party cookie rather than localStorage because it must be
 * readable at request time if the firm ever gates server-rendered embeds, and
 * because a cookie expires on its own — localStorage does not.
 */

export const CONSENT_COOKIE = "orechdin_consent";

/**
 * Bump on any change to the categories, the vendors inside them, or the
 * purposes described in the cookie policy. A visitor holding an older version
 * is treated as undecided and is asked again.
 */
export const CONSENT_VERSION = 1;

/** ~6 months, the ceiling the Belgian DPA points to for a consent record. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/**
 * Optional categories only. `necessary` is deliberately absent from the type:
 * it is not a choice, it is the baseline, and modelling it as a togglable
 * field invites a UI that pretends otherwise.
 *
 * - `functional` — external content embedded from a third party at the
 *   visitor's request. Today this is exactly one thing: the Google Maps frame
 *   on the office page, which sets Google cookies the moment it loads.
 * - `statistics` — audience measurement. No such tool is live on the site
 *   today; the switch exists so that if one is ever added it is gated from
 *   the first deploy rather than bolted on afterwards.
 *
 * There is no `marketing` category: the firm runs no advertising, retargeting
 * or social pixels, and declaring a category the site does not use would be
 * its own transparency problem.
 */
export type OptionalCategory = "functional" | "statistics";

export const OPTIONAL_CATEGORIES: readonly OptionalCategory[] = [
  "functional",
  "statistics",
] as const;

export type ConsentChoices = Record<OptionalCategory, boolean>;

export type ConsentRecord = ConsentChoices & {
  version: number;
  /** ISO date of the decision — part of the accountability trail. */
  decidedAt: string;
};

/** The pre-decision state: refuse everything optional. */
export const DENY_ALL: ConsentChoices = {
  functional: false,
  statistics: false,
};

export const ALLOW_ALL: ConsentChoices = {
  functional: true,
  statistics: true,
};

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

/**
 * Returns the stored decision, or `null` when the visitor has not decided —
 * which is also what a malformed, foreign or outdated record collapses to.
 * Callers must treat `null` as "no consent", never as "ask later".
 */
export function readConsent(): ConsentRecord | null {
  if (!isBrowser()) return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(CONSENT_COOKIE + "="));
  if (!match) return null;

  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;

    // A record written under an older category set says nothing about the
    // current one. Ask again rather than inferring.
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      version: CONSENT_VERSION,
      decidedAt:
        typeof parsed.decidedAt === "string" ? parsed.decidedAt : "",
      functional: parsed.functional === true,
      statistics: parsed.statistics === true,
    };
  } catch {
    return null;
  }
}

export function writeConsent(choices: ConsentChoices): ConsentRecord {
  const record: ConsentRecord = {
    ...choices,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString().slice(0, 10),
  };

  if (isBrowser()) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      CONSENT_COOKIE +
      "=" +
      encodeURIComponent(JSON.stringify(record)) +
      "; Path=/; Max-Age=" +
      CONSENT_MAX_AGE_SECONDS +
      "; SameSite=Lax" +
      secure;
  }

  return record;
}

/**
 * Drops the consent record itself, returning the visitor to the undecided
 * state. Used by the "withdraw" control in the cookie policy.
 *
 * Note the limit, which the policy states plainly: this stops the site from
 * loading third-party content again, but it cannot reach into cookies another
 * domain has already set. Only the browser can clear those.
 */
export function clearConsent(): void {
  if (!isBrowser()) return;
  document.cookie = CONSENT_COOKIE + "=; Path=/; Max-Age=0; SameSite=Lax";
}

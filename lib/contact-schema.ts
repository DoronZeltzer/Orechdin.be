import { z } from "zod";

/**
 * Validation for the contact form, shared by the browser (to show errors next
 * to the field) and the server (which must never trust the browser).
 *
 * `website` is a honeypot: a field real visitors cannot see and so never fill
 * in, but form-filling bots do. It is deliberately not constrained here. A bot
 * that trips it should get an ordinary-looking success, not a validation
 * error that teaches it what to avoid, so the route checks it separately.
 */
export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 200,
  phoneMax: 40,
  messageMin: 10,
  messageMax: 5000,
} as const;

export const contactSchema = z.object({
  name: z.string().trim().min(CONTACT_LIMITS.nameMin).max(CONTACT_LIMITS.nameMax),
  email: z.string().trim().max(CONTACT_LIMITS.emailMax).email(),
  // Optional; digits, spaces and the usual separators only.
  phone: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.phoneMax)
    .regex(/^[0-9+()./\s-]*$/)
    .optional(),
  message: z.string().trim().min(CONTACT_LIMITS.messageMin).max(CONTACT_LIMITS.messageMax),
  /** Language of the page the visitor wrote from, so the office can reply in it. */
  locale: z.enum(["en", "nl", "he"]),
  /** Honeypot. */
  website: z.string().optional(),
  /** Milliseconds the form was open. Bots submit within a blink. */
  elapsedMs: z.number().min(0),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Error codes the route can return; the form maps each to a message. */
export type ContactError = "validation" | "rate_limited" | "not_configured" | "send_failed";

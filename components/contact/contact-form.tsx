"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { contactSchema, type ContactError } from "@/lib/contact-schema";
import { SITE } from "@/lib/site";

type FieldName = "name" | "email" | "phone" | "message";
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "sending" | "sent" | "failed";

/**
 * The contact form.
 *
 * It posts to our own `/api/contact`, which emails the office. Nothing here
 * loads a third party, so the form needs no consent and sets no cookie.
 *
 * Validation runs in the browser with the same schema the server uses, so the
 * messages appear beside the field. Whatever the server then says, the visitor
 * is never left with a dead end: every failure shows the phone number and email
 * address, so a broken mail setup costs a click, not a lost enquiry.
 */
export function ContactForm() {
  const t = useTranslations("ContactPage.form");
  const tc = useTranslations("ContactPage");
  const locale = useLocale() as Locale;

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<ContactError | null>(null);

  const startedAt = useRef<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (status === "sent") headingRef.current?.focus();
  }, [status]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").trim();
    const candidate = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: phone === "" ? undefined : phone,
      message: String(form.get("message") ?? ""),
      locale,
      website: String(form.get("website") ?? ""),
      elapsedMs: Date.now() - startedAt.current,
    };

    const parsed = contactSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (key in { name: 1, email: 1, phone: 1, message: 1 } && !next[key]) next[key] = t(`errors.${key}`);
      }
      setErrors(next);
      // Move focus to the first field that needs attention.
      const first = (["name", "email", "phone", "message"] as FieldName[]).find((k) => next[k]);
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    setErrors({});
    setServerError(null);
    setStatus("sending");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        setStatus("sent");
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: ContactError };
      setServerError(body.error ?? "send_failed");
    } catch {
      setServerError("send_failed");
    }
    setStatus("failed");
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-brand-blue p-8 sm:p-10">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl leading-tight outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-3xl">
          {t("successTitle")}
        </h2>
        <p className="mt-3 text-lg">{t("successBody")}</p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={onSubmit}
      // A message about a field disappears as soon as the visitor starts fixing it.
      onInput={(e) => {
        const name = (e.target as HTMLInputElement).name as FieldName;
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
      }}
      noValidate
      className="flex flex-col gap-6"
      aria-describedby="contact-notice"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="contact-name" label={t("name")} error={errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            disabled={sending}
          />
        </Field>
        <Field id="contact-email" label={t("email")} error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            disabled={sending}
          />
        </Field>
      </div>

      <Field id="contact-phone" label={t("phone")} optional optionalLabel={t("optional")} error={errors.phone}>
        <Input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "contact-phone-error" : undefined}
          disabled={sending}
        />
      </Field>

      <Field id="contact-message" label={t("message")} hint={t("messageHint")} error={errors.message}>
        <Textarea
          id="contact-message"
          name="message"
          required
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
          disabled={sending}
        />
      </Field>

      {/* Honeypot. Invisible and unreachable for people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p id="contact-notice" className="text-sm leading-relaxed text-brand-black-60">
        {t.rich("notice", {
          privacy: (chunks) => (
            <Link href="/privacy" className="font-bold text-brand-black underline decoration-brand-black decoration-1 underline-offset-4 hover:bg-brand-blue">
              {chunks}
            </Link>
          ),
        })}
      </p>

      <div aria-live="polite">
        {status === "failed" && (
          <div className="mb-6 rounded-xl border border-brand-black-60 bg-brand-wash p-5">
            <p className="flex items-start gap-2 font-bold">
              <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-black text-xs leading-none text-brand-white">
                !
              </span>
              {serverError === "rate_limited" ? t("errors.rateLimited") : t("errors.send")}
            </p>
            <p className="mt-3 text-sm text-brand-black-60">{t("fallback")}</p>
            <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-bold">
              <a href={`tel:${SITE.phoneTel}`} className="underline decoration-brand-black decoration-1 underline-offset-4 hover:bg-brand-blue">
                <bdi dir="ltr">{SITE.phoneDisplay}</bdi>
              </a>
              <a href={`mailto:${SITE.email}`} className="underline decoration-brand-black decoration-1 underline-offset-4 hover:bg-brand-blue">
                <bdi dir="ltr">{SITE.email}</bdi>
              </a>
            </p>
          </div>
        )}
      </div>

      {/* The notices from the brief, shown before the visitor submits. */}
      <div className="space-y-3 rounded-2xl bg-brand-wash p-6 text-[0.95rem] leading-relaxed">
        <p className="font-bold">{tc("enquiry.review")}</p>
        <p>
          {tc.rich("enquiry.notAccepted", {
            not: (chunks) => <u>{chunks}</u>,
          })}
        </p>
        <p>
          {tc.rich("enquiry.documents", {
            mail: (chunks) => (
              <a href={`mailto:${SITE.email}`} className="font-bold underline decoration-brand-black decoration-1 underline-offset-4">
                <bdi dir="ltr">{chunks}</bdi>
              </a>
            ),
          })}
        </p>
        <div className="border-t border-brand-black/15 pt-3">
          <p className="font-bold">{tc("enquiry.urgentTitle")}</p>
          <p className="mt-1">{tc("enquiry.urgent")}</p>
        </div>
      </div>

      <div>
        <Button type="submit" arrow disabled={sending}>
          {sending ? t("sending") : t("submit")}
        </Button>
      </div>
    </form>
  );
}

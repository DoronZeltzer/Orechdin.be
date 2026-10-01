import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form controls in the brand's rectilinear style: square corners, a black
 * 2px border, and a black focus ring (the accent blue is too pale on white to
 * be a visible focus indicator).
 *
 * The brand has no error colour, and inventing one would break the palette, so
 * an invalid field is marked by more than colour: a thick black underline, an
 * icon and a written message tied to the field with `aria-describedby`. That
 * also means it does not depend on telling red from black.
 */
const CONTROL =
  "block w-full rounded-[3px] border-2 border-brand-black bg-brand-white px-4 py-3 text-base text-brand-black placeholder:text-brand-black-40 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-b-[6px]";

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  optionalLabel,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  optionalLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-bold text-brand-black">
        <span>{label}</span>
        {optional && optionalLabel && (
          <span className="text-xs font-normal uppercase tracking-wider text-brand-black-60">{optionalLabel}</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-brand-black-60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-2 text-sm font-bold text-brand-black">
          <span aria-hidden className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center bg-brand-black text-[0.7rem] leading-none text-brand-white">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-40 resize-y leading-relaxed", className)} {...props} />;
}

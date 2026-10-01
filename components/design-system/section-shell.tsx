import React from "react";
import { cn } from "@/lib/utils";

/**
 * `SectionShell`: the full-width wrapper every page section sits in.
 *
 * Rhythm: the old shell used `py-24 lg:py-36` on every section, which made the
 * homepage very long with nothing standing out. `py-16 lg:py-24` keeps the air
 * but lets the page breathe at a reading pace. Sections now alternate between
 * surfaces so the eye can tell where one idea ends and the next begins.
 *
 * Surfaces are the brand's own colours (guidelines section 03):
 *   - `default`  white
 *   - `wash`     #d0e1ee, which the guidelines reserve for backgrounds
 *   - `dark`     black, text in white
 *   - `blue`     the accent #95b6df, text in black
 *
 * `elevated` and `accent` are the old names. They are kept so pages not yet
 * redesigned keep rendering, and map to `wash` and `default`.
 */
type Background = "default" | "wash" | "dark" | "blue" | "elevated" | "accent";

const SURFACE: Record<Background, string> = {
  default: "bg-brand-white text-brand-black",
  wash: "bg-brand-wash text-brand-black",
  dark: "bg-brand-black text-brand-white",
  blue: "bg-brand-blue text-brand-black",
  elevated: "bg-brand-wash text-brand-black",
  accent: "bg-brand-white text-brand-black",
};

const WIDTH = {
  editorial: "max-w-editorial",
  wide: "max-w-wide",
  narrow: "max-w-narrow",
} as const;

export function SectionShell({
  children,
  className = "",
  id,
  background = "default",
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: Background;
  /** `editorial` (66rem) for prose-heavy content, `wide` (78rem) for layouts. */
  width?: keyof typeof WIDTH;
}) {
  return (
    <section
      id={id}
      className={cn("relative w-full py-16 lg:py-24", SURFACE[background], className)}
    >
      <div className={cn("mx-auto px-6 sm:px-10 lg:px-16", WIDTH[width])}>{children}</div>
    </section>
  );
}

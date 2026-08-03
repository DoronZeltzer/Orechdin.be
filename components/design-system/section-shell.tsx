import React from "react";

/**
 * `SectionShell` — the canonical full-width section wrapper.
 *
 * Geometry (the entire site reads to one rhythm):
 *   - vertical: `py-24 lg:py-36` editorial breathing room
 *   - container: 78rem `max-w-wide` — generous on desktop, balanced on tablet
 *   - gutters: 1.5rem → 4rem at lg, mirroring a printed monograph
 *
 * Backgrounds:
 *   - `default`  — paper, no chrome
 *   - `elevated` — warm ivory plate with a hairline rule top + bottom
 *   - `accent`   — paper with a single soft bronze gradient wash, used at
 *                  most twice per page so it never reads as decoration
 */
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
  background?: "default" | "elevated" | "accent";
  /** `editorial` (66rem) for prose-heavy content, `wide` (78rem) for layouts. */
  width?: "editorial" | "wide" | "narrow";
}) {
  const bgClasses = {
    default: "bg-orech-paper",
    elevated:
      "bg-orech-slate/70 [background-image:linear-gradient(to_bottom,transparent,transparent)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-orech-line/80 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-orech-line/80",
    accent: "bg-orech-paper relative overflow-hidden",
  } as const;

  const widthClasses = {
    editorial: "max-w-editorial",
    wide: "max-w-wide",
    narrow: "max-w-narrow",
  } as const;

  return (
    <section
      id={id}
      className={`relative w-full py-24 lg:py-36 ${bgClasses[background]} ${className}`}
    >
      {background === "accent" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
        >
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-orech-bronze/8 to-transparent blur-3xl" />
        </div>
      )}
      <div
        className={`relative z-10 mx-auto px-6 sm:px-10 lg:px-16 ${widthClasses[width]}`}
      >
        {children}
      </div>
    </section>
  );
}

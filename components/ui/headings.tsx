import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page and section headings: one pattern, used everywhere.
 *
 * The site repeated "eyebrow, heading, lead" by hand in a dozen places with
 * different sizes, alignments and spacing. These two components replace that,
 * so a page's hierarchy is the same wherever you land.
 *
 * `tone="dark"` is for black or photographic backgrounds: the text goes white
 * and the eyebrow bar stays blue, which is the pairing the guidelines show on
 * their black slogan pages.
 */
type Tone = "light" | "dark" | "blue";
type Align = "left" | "center";

const ALIGN: Record<Align, string> = {
  left: "items-start text-start",
  center: "items-center text-center mx-auto",
};

const TEXT: Record<Tone, { heading: string; lead: string; eyebrow: string }> = {
  // The lead is black at 80%, not 60%: black at 60% is 5.7:1 on white but only
  // 4.3:1 on the wash blue these headings often sit on, just under the 4.5:1
  // WCAG asks of body text. At 80% it clears 10:1 on both.
  light: { heading: "text-brand-black", lead: "text-brand-black-80", eyebrow: "text-brand-black" },
  dark: { heading: "text-brand-white", lead: "text-brand-white/80", eyebrow: "text-brand-white" },
  // On the accent blue the eyebrow's own blue bar would vanish, so it turns black.
  // Black at 80% on the blue is about 6:1.
  blue: { heading: "text-brand-black", lead: "text-brand-black-80", eyebrow: "text-brand-black before:bg-brand-black" },
};

type Props = {
  eyebrow?: ReactNode;
  /** Extra classes for the heading element itself, e.g. a smaller size inside a half-width column. */
  titleClassName?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: Align;
  tone?: Tone;
  className?: string;
};

/** The h1 that opens a page. */
export function PageHeading({ eyebrow, titleClassName, title, lead, align = "left", tone = "light", className }: Props) {
  const t = TEXT[tone];
  return (
    <div className={cn("flex max-w-3xl flex-col gap-5", ALIGN[align], className)}>
      {eyebrow && <p className={cn("eyebrow", t.eyebrow)}>{eyebrow}</p>}
      <h1 className={cn("text-balance break-words text-[1.8rem] leading-[1.1] tracking-editorial sm:text-5xl sm:leading-[1.08] lg:text-6xl", t.heading, titleClassName)}>
        {title}
      </h1>
      {lead && <p className={cn("max-w-2xl text-base leading-relaxed sm:text-xl", t.lead)}>{lead}</p>}
    </div>
  );
}

/** The h2 that opens a section. */
export function SectionHeading({ eyebrow, titleClassName, title, lead, align = "left", tone = "light", className }: Props) {
  const t = TEXT[tone];
  return (
    <div className={cn("flex max-w-3xl flex-col gap-4", ALIGN[align], className)}>
      {eyebrow && <p className={cn("eyebrow", t.eyebrow)}>{eyebrow}</p>}
      <h2 className={cn("text-balance break-words text-[1.55rem] leading-[1.15] tracking-editorial sm:text-4xl sm:leading-[1.12] lg:text-[2.6rem]", t.heading, titleClassName)}>
        {title}
      </h2>
      {lead && <p className={cn("max-w-2xl text-base leading-relaxed sm:text-lg", t.lead)}>{lead}</p>}
    </div>
  );
}

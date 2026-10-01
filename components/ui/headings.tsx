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
type Tone = "light" | "dark";
type Align = "left" | "center";

const ALIGN: Record<Align, string> = {
  left: "items-start text-left",
  center: "items-center text-center mx-auto",
};

const TEXT: Record<Tone, { heading: string; lead: string; eyebrow: string }> = {
  // The lead is black at 80%, not 60%: black at 60% is 5.7:1 on white but only
  // 4.3:1 on the wash blue these headings often sit on, just under the 4.5:1
  // WCAG asks of body text. At 80% it clears 10:1 on both.
  light: { heading: "text-brand-black", lead: "text-brand-black-80", eyebrow: "text-brand-black" },
  dark: { heading: "text-brand-white", lead: "text-brand-white/80", eyebrow: "text-brand-white" },
};

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: Align;
  tone?: Tone;
  className?: string;
};

/** The h1 that opens a page. */
export function PageHeading({ eyebrow, title, lead, align = "left", tone = "light", className }: Props) {
  const t = TEXT[tone];
  return (
    <div className={cn("flex max-w-3xl flex-col gap-5", ALIGN[align], className)}>
      {eyebrow && <p className={cn("eyebrow", t.eyebrow)}>{eyebrow}</p>}
      <h1 className={cn("text-balance text-4xl leading-[1.08] tracking-editorial sm:text-5xl lg:text-6xl", t.heading)}>
        {title}
      </h1>
      {lead && <p className={cn("max-w-2xl text-lg leading-relaxed sm:text-xl", t.lead)}>{lead}</p>}
    </div>
  );
}

/** The h2 that opens a section. */
export function SectionHeading({ eyebrow, title, lead, align = "left", tone = "light", className }: Props) {
  const t = TEXT[tone];
  return (
    <div className={cn("flex max-w-3xl flex-col gap-4", ALIGN[align], className)}>
      {eyebrow && <p className={cn("eyebrow", t.eyebrow)}>{eyebrow}</p>}
      <h2 className={cn("text-balance text-3xl leading-[1.12] tracking-editorial sm:text-4xl lg:text-[2.6rem]", t.heading)}>
        {title}
      </h2>
      {lead && <p className={cn("max-w-2xl text-base leading-relaxed sm:text-lg", t.lead)}>{lead}</p>}
    </div>
  );
}

import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The one button of the site.
 *
 * Before this, the site had at least four primary-button styles, with
 * different padding and, worse, different text colours: dark text on the
 * accent blue on the homepage, but white text on it elsewhere, which is about
 * 2.1:1 and unreadable. Here the pairings are fixed to ones that pass:
 *
 *   primary        black on the accent blue (about 9:1), black on hover
 *   dark           white on black, blue on hover
 *   outline        black on white with a black border
 *   outline-light  white on black with a white border, for dark sections
 *
 * Corners are square, like the icon tiles and colour fields in the brand
 * guidelines.
 */
type Variant = "primary" | "dark" | "outline" | "outline-light";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand-blue text-brand-black border-2 border-brand-blue hover:bg-brand-black hover:border-brand-black hover:text-brand-white",
  dark:
    "bg-brand-black text-brand-white border-2 border-brand-black hover:bg-brand-blue hover:border-brand-blue hover:text-brand-black",
  outline:
    "bg-transparent text-brand-black border-2 border-brand-black hover:bg-brand-black hover:text-brand-white",
  "outline-light":
    "bg-transparent text-brand-white border-2 border-brand-white hover:bg-brand-white hover:text-brand-black",
};

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[3px] px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";

type Common = {
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

type AsLink = Common & { href: ComponentProps<typeof Link>["href"] } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >;
type AsButton = Common & { href?: undefined } & Omit<
    ComponentProps<"button">,
    "className" | "children"
  >;

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", arrow = false, className, children, ...rest } = props;
  const classes = cn(BASE, VARIANT[variant], className);
  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link {...(rest as Omit<AsLink, keyof Common>)} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" {...(rest as Omit<AsButton, keyof Common>)} className={classes}>
      {content}
    </button>
  );
}

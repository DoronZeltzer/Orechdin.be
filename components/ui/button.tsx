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
 * 2.1:1 and unreadable. Here the pairings are fixed to ones that pass, and the
 * corners are soft, as the site had before the first redesign.
 *
 * Black is kept for text and never used as a fill, so the page does not turn
 * heavy:
 *
 *   primary   black on the accent blue (about 9:1)
 *   white     black on white, for use on blue panels
 *   outline   black on transparent with a grey-black border, fills with the
 *             wash blue on hover
 */
type Variant = "primary" | "white" | "outline";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand-blue text-brand-black border-2 border-brand-blue shadow-sm hover:-translate-y-px hover:shadow-md",
  white:
    "bg-brand-white text-brand-black border-2 border-brand-white shadow-sm hover:-translate-y-px hover:shadow-md",
  outline:
    "bg-transparent text-brand-black border-2 border-brand-black-60 hover:border-brand-black hover:bg-brand-wash",
};

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-7 py-3 text-[0.82rem] font-bold uppercase tracking-[0.12em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm";

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

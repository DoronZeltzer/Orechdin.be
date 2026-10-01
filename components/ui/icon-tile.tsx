import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A square tile in the accent blue with a black icon: the brand guidelines'
 * icon set (section 07) shown as blue squares. The guidelines put icons in
 * black or blue on light backgrounds; black on the blue tile is about 9:1.
 * Decorative: the text beside it carries the meaning, so it is hidden from
 * screen readers.
 */
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex h-12 w-12 shrink-0 items-center justify-center bg-brand-blue text-brand-black", className)}
    >
      <Icon className="h-6 w-6" strokeWidth={1.75} />
    </span>
  );
}

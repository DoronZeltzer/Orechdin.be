"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  /** Optional italic kicker rendered above the title (e.g. matter category). */
  kicker?: string;
  className?: string;
}

/**
 * Editorial service card.
 *
 * Geometry: hairline plate (no 1px border), 1.5rem gutter, generous 2rem
 * vertical rhythm. Lift on hover is intentional but quiet (3px) — the card
 * should feel like a card on a museum wall, not a SaaS tile.
 */
export function ServiceCard({
  title,
  description,
  href,
  icon,
  kicker,
  className,
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block h-full outline-none focus-visible:ring-2 focus-visible:ring-orech-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-orech-paper rounded-2xl",
        className,
      )}
    >
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="plate relative flex h-full flex-col p-8"
      >
        {icon && (
          <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-full border border-orech-bronze/30 bg-orech-bronze/5 text-orech-bronze">
            {icon}
          </div>
        )}

        {kicker && (
          <p className="italic-display mb-2 text-[0.95rem] leading-none">
            {kicker}
          </p>
        )}

        <h4 className="display-headline text-[1.4rem] leading-snug">
          {title}
        </h4>

        <span aria-hidden className="rule-gold mb-5" />

        <p className="text-[0.95rem] leading-relaxed text-orech-mist">
          {description}
        </p>

        <div className="mt-8 flex items-center gap-2 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-orech-ink/60 transition-colors group-hover:text-orech-bronze">
          Read more
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </div>
      </motion.article>
    </Link>
  );
}

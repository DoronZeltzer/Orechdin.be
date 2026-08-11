"use client";

import React from "react";

/**
 * Lightweight, safe renderer for the NEO bubble. Supports a deliberately
 * narrow Markdown subset emitted by `lib/neo/legal-reply.ts`:
 *   - **bold**
 *   - _italic_
 *   - leading "> " for blockquote (disclaimer)
 *   - leading "→ " for next-step bullet
 *   - leading "· " for KB sub-hit bullet
 * No raw HTML. No links inside text - citations and follow-ups live in
 * dedicated UI surfaces.
 */
export function NeoRichText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (line === "") return <div key={idx} aria-hidden className="h-1" />;

        if (line.startsWith("> ")) {
          return (
            <p
              key={idx}
              className="border-l-2 border-orech-bronze/40 pl-2 text-[0.72rem] italic leading-snug text-orech-mist/85"
            >
              {renderInline(line.slice(2))}
            </p>
          );
        }

        if (line.startsWith("→ ")) {
          return (
            <p
              key={idx}
              className="flex items-start gap-1.5 text-[0.82rem] font-medium text-orech-ink"
            >
              <span aria-hidden className="text-orech-bronze">→</span>
              <span>{renderInline(line.slice(2))}</span>
            </p>
          );
        }

        if (line.startsWith("· ")) {
          return (
            <p
              key={idx}
              className="flex items-start gap-1.5 pl-1 text-[0.78rem] leading-snug text-orech-mist/95"
            >
              <span aria-hidden className="text-orech-bronze/70">·</span>
              <span>{renderInline(line.slice(2))}</span>
            </p>
          );
        }

        return (
          <p key={idx} className="text-[0.84rem] leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_)/g;

function renderInline(text: string): React.ReactNode {
  const parts = text.split(TOKEN).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-orech-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="italic text-orech-mist/95">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

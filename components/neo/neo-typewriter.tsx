"use client";

import { useEffect, useRef, useState } from "react";

import { NeoRichText } from "./neo-rich-text";

interface NeoTypewriterProps {
  /** Final text the assistant produced. */
  text: string;
  /** When true, reveal char-by-char. When false, show the full text immediately. */
  active: boolean;
  /** Called once when the reveal completes (or is skipped). */
  onComplete?: () => void;
  /** Override the per-tick reveal step. */
  charsPerTick?: number;
  /** Override the tick interval in ms. */
  intervalMs?: number;
}

/**
 * Renders an assistant reply that builds up character-by-character, the way a
 * person types. Wraps NeoRichText, so markdown structure (bold, blockquote,
 * arrow bullets) materialises live as more text arrives. Click anywhere on
 * the bubble to skip to the end. Honours prefers-reduced-motion.
 */
export function NeoTypewriter({
  text,
  active,
  onComplete,
  charsPerTick,
  intervalMs = 14,
}: NeoTypewriterProps) {
  const [revealed, setRevealed] = useState<number>(active ? 0 : text.length);
  const reduceMotionRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!active || text.length === 0) {
      setRevealed(text.length);
      return;
    }

    if (reduceMotionRef.current) {
      setRevealed(text.length);
      onCompleteRef.current?.();
      return;
    }

    setRevealed(0);

    // Adaptive cadence: long replies get larger steps so the user is never
    // forced to wait through a 1500-char block at typing speed.
    const step =
      charsPerTick ??
      (text.length > 600 ? 6 : text.length > 320 ? 4 : text.length > 140 ? 3 : 2);

    // Human breathing: brief pauses after punctuation and line breaks so the
    // reply doesn't feel like a ticker tape. Tuned so a comma is barely felt
    // and a period reads as a real sentence boundary.
    const pauseAfter = (ch: string): number => {
      if (ch === "." || ch === "!" || ch === "?") return 220;
      if (ch === "\n") return 160;
      if (ch === "," || ch === ";" || ch === ":") return 90;
      return 0;
    };
    // Tiny per-tick jitter (±15 %) so the cadence feels organic rather than
    // mechanical. Random is fine here - purely cosmetic.
    const jitter = () => 1 + (Math.random() - 0.5) * 0.3;

    let cur = 0;
    let cancelled = false;
    let timeoutId: number | null = null;

    const tick = () => {
      if (cancelled) return;
      const next = Math.min(text.length, cur + step);
      const lastChar = text[next - 1] ?? "";
      cur = next;
      setRevealed(cur);
      if (cur >= text.length) {
        onCompleteRef.current?.();
        return;
      }
      const baseDelay = intervalMs * jitter();
      const delay = baseDelay + pauseAfter(lastChar);
      timeoutId = window.setTimeout(tick, delay);
    };

    timeoutId = window.setTimeout(tick, intervalMs);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [active, text, charsPerTick, intervalMs]);

  const skip = () => {
    if (revealed >= text.length) return;
    setRevealed(text.length);
    onCompleteRef.current?.();
  };

  const isStreaming = active && revealed < text.length;
  const display = isStreaming ? text.slice(0, revealed) : text;

  return (
    <div
      onClick={isStreaming ? skip : undefined}
      role={isStreaming ? "button" : undefined}
      aria-label={isStreaming ? "Tap to reveal the full reply" : undefined}
      className={isStreaming ? "cursor-pointer" : undefined}
    >
      <NeoRichText text={display} />
      {isStreaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[0.95em] w-[2px] -mb-[2px] align-middle bg-orech-bronze/80 motion-safe:animate-pulse"
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API is browser-only and not in the standard lib types.
// We type just enough of it for our purposes.
type SREvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
};

type SRErrorEvent = { error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SREvent) => void) | null;
  onerror: ((ev: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SRWindow {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

const LOCALE_TO_BCP47: Record<string, string> = {
  nl: "nl-BE",
  fr: "fr-BE",
  en: "en-US",
};

export interface UseSpeechRecognitionOptions {
  /** Site locale (en/nl/fr). Mapped to a BCP-47 tag for the recogniser. */
  locale?: string;
  /** Called every time the interim transcript updates. */
  onInterim?: (text: string) => void;
  /** Called once the user stops speaking and the recogniser commits a phrase. */
  onFinal?: (text: string) => void;
}

export interface UseSpeechRecognitionResult {
  /** True if the browser exposes a usable SpeechRecognition API. */
  supported: boolean;
  /** True while the recogniser is actively listening. */
  listening: boolean;
  /** Latest interim (un-committed) transcript fragment. */
  interim: string;
  /** Last error code surfaced by the API (e.g. "not-allowed"). */
  error: string | null;
  start: () => void;
  stop: () => void;
  /** Force-stop and reset interim/error state. */
  cancel: () => void;
}

/**
 * Browser-native speech-to-text hook for the NEO composer.
 *
 * - Uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
 *   No backend, no extra cost. Works in Chrome, Edge, Safari.
 * - Locale-aware (en-US / nl-BE / fr-BE) so dictation matches the visitor's
 *   language without an extra prompt.
 * - Streams interim results so the composer can show words as the user speaks.
 * - Gracefully reports `supported: false` when the API is missing — the UI
 *   can simply hide the mic button in that case.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const { locale = "en", onInterim, onFinal } = options;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onInterimRef = useRef(onInterim);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  // Detect API once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as SRWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  const lang = LOCALE_TO_BCP47[locale] ?? "en-US";

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as SRWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("not-supported");
      return;
    }

    // Stop any previous instance first so we don't stack listeners.
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interimChunk = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finalChunk += text;
        else interimChunk += text;
      }

      if (interimChunk) {
        setInterim(interimChunk);
        onInterimRef.current?.(interimChunk);
      }

      if (finalChunk) {
        // A trailing space keeps multi-phrase dictations readable.
        const cleaned = finalChunk.trim();
        if (cleaned) onFinalRef.current?.(cleaned + " ");
        setInterim("");
      }
    };

    rec.onerror = (event) => {
      setError(event.error || "error");
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    try {
      rec.start();
      recRef.current = rec;
      setError(null);
      setListening(true);
    } catch {
      // start() throws if called twice in a row; treat as "already running".
      setListening(true);
    }
  }, [lang]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const cancel = useCallback(() => {
    const rec = recRef.current;
    if (rec) {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    }
    setListening(false);
    setInterim("");
    setError(null);
  }, []);

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (!rec) return;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, []);

  return { supported, listening, interim, error, start, stop, cancel };
}

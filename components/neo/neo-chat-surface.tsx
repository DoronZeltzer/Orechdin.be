"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { useNeo } from "./neo-context";
import { NeoRichText } from "./neo-rich-text";
import { NeoTypewriter } from "./neo-typewriter";
import { useSpeechRecognition } from "@/lib/neo/use-speech-recognition";

const COMPOSER_LIMIT = 1500;

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt";
const MAX_FILE_SIZE_MB = 25;
const MAX_FILES = 10;
const BLOCKED_EXTS = [".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".com", ".scr"];

export interface NeoChatSurfaceProps {
  /** Whether the surface is the compact side panel or the workspace. */
  size?: "panel" | "workspace";
  /** Called when the user navigates away through a citation link. */
  onNavigate?: () => void;
  /** Composer placeholder override. */
  placeholder?: string;
  /** Show the inline paperclip + chip strip in the composer (default true in draft states). */
  enableAttach?: boolean;
}

export function NeoChatSurface({
  size = "panel",
  onNavigate,
  placeholder,
  enableAttach = true,
}: NeoChatSurfaceProps) {
  const {
    messages,
    assistantMeta,
    isGenerating,
    sendMessage,
    state,
    uploadedFiles,
    setUploadedFiles,
  } = useNeo();
  const locale = useLocale();
  const tNeo = useTranslations("NeoChat");
  const [input, setInput] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [attachError, setAttachError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  // Once the user dictates anything in the current composer draft we mark the
  // outgoing message as voice-originated. Cleared after each send.
  const [composedViaVoice, setComposedViaVoice] = useState(false);
  // Snapshot of `input` taken when dictation starts, so each interim chunk
  // replaces only the dictated tail rather than appending duplicates.
  const dictationBaseRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  const speech = useSpeechRecognition({
    locale,
    onInterim: (text) => {
      const merged =
        dictationBaseRef.current +
        (dictationBaseRef.current && !dictationBaseRef.current.endsWith(" ") ? " " : "") +
        text;
      setInput(merged.slice(0, COMPOSER_LIMIT));
    },
    onFinal: (text) => {
      // Commit the final phrase to the input, then re-baseline so the next
      // interim chunk starts from this committed text.
      const merged =
        dictationBaseRef.current +
        (dictationBaseRef.current && !dictationBaseRef.current.endsWith(" ") ? " " : "") +
        text;
      const next = merged.slice(0, COMPOSER_LIMIT);
      dictationBaseRef.current = next.trimEnd();
      setInput(next);
      setComposedViaVoice(true);
    },
  });

  // On first mount, treat any pre-existing assistant messages as already
  // revealed - we only want to typewriter-stream replies that arrive while
  // the user is watching.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const initial = new Set<string>();
    for (const m of messages) if (m.role === "assistant") initial.add(m.id);
    setRevealedIds(initial);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isGenerating]);

  const lastMeta = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === "assistant" && assistantMeta[m.id]) return assistantMeta[m.id];
    }
    return null;
  })();

  // Pick a human-feeling status hint while NEO is generating. Stable per
  // turn so it doesn't flicker between renders.
  const typingHint = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return tNeo("typing.thinking");
    if (
      uploadedFiles.length > 0 &&
      lastUser.content_redacted.length < 80 &&
      messages.filter((m) => m.role === "assistant").length <= 1
    ) {
      return tNeo("typing.readingFile");
    }
    if (lastUser.content_redacted.length > 280) return tNeo("typing.readingMessage");
    const rotation = [tNeo("typing.thinking"), tNeo("typing.puttingTogether"), tNeo("typing.writingBack")];
    return rotation[messages.length % rotation.length];
  }, [messages, uploadedFiles, tNeo]);

  // The single message currently being typed out (most recent un-revealed
  // assistant reply). Everything else renders instantly.
  const streamingId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role !== "assistant") return null;
      if (!revealedIds.has(m.id)) return m.id;
      return null;
    }
    return null;
  }, [messages, revealedIds]);

  const markRevealed = useCallback((id: string) => {
    setRevealedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const QUICK_PROMPTS = [
    tNeo("quickPrompts.cases"),
    tNeo("quickPrompts.lawyers"),
    tNeo("quickPrompts.reach")
  ];

  const submit = (text: string, opts?: { fromQuickPrompt?: boolean }) => {
    setInput("");
    if (speech.listening) speech.stop();
    dictationBaseRef.current = "";
    const wasVoice = composedViaVoice && !opts?.fromQuickPrompt;
    setComposedViaVoice(false);
    void sendMessage(text, { via: wasVoice ? "voice" : "keyboard" });
  };

  const toggleDictation = () => {
    if (!speech.supported) return;
    if (speech.listening) {
      speech.stop();
      return;
    }
    dictationBaseRef.current = input;
    setComposedViaVoice(true);
    speech.start();
    composerRef.current?.focus();
  };

  // ── File attach helpers (inline in composer) ────────────────────────────────
  const showAttach =
    enableAttach &&
    (state === "DRAFT_DISCOVERY" || state === "DRAFT_CASE_BUILDING");

  const handleFile = (file: File) => {
    setAttachError("");
    if (BLOCKED_EXTS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setAttachError(tNeo("attach.executableBlocked"));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setAttachError(tNeo("attach.fileTooLarge", { maxSize: MAX_FILE_SIZE_MB }));
      return;
    }
    if (uploadedFiles.includes(file.name)) {
      setAttachError(tNeo("attach.alreadyAttached"));
      return;
    }
    if (uploadedFiles.length >= MAX_FILES) {
      setAttachError(tNeo("attach.maxFiles", { maxFiles: MAX_FILES }));
      return;
    }
    setUploadedFiles((prev) => [...prev, file.name]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(handleFile);
  };

  const commitPastedEvidence = () => {
    setAttachError("");
    const text = pasteValue.trim();
    if (text.length < 30) {
      setAttachError(tNeo("paste.errorShort"));
      return;
    }
    if (uploadedFiles.length >= MAX_FILES) {
      setAttachError(`Maximum ${MAX_FILES} files per intake.`);
      return;
    }
    const existingPastes = uploadedFiles.filter((f) => f.startsWith("pasted-evidence-")).length;
    const seq = String(existingPastes + 1).padStart(3, "0");
    const filename = `pasted-evidence-${seq}.txt`;
    setUploadedFiles((prev) => [...prev, filename]);
    setPasteValue("");
    setPasteOpen(false);
    void sendMessage(
      `${tNeo("paste.prefix", { filename })}\n${text.length > 1200 ? `${text.slice(0, 1200)}…` : text}`,
      { via: "keyboard" },
    );
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(e) => {
        if (!showAttach) return;
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!showAttach) return;
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
      }}
      onDrop={(e) => {
        if (!showAttach) return;
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {showAttach && isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 m-3 flex items-center justify-center rounded-2xl border-2 border-dashed border-orech-bronze bg-orech-bronze/5 text-[0.85rem] font-medium text-orech-bronze">
          {tNeo("attach.drop")}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <EmptyState onPrompt={(p) => submit(p)} size={size} tNeo={tNeo} />
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((msg) => {
              const meta = assistantMeta[msg.id];
              const isUser = msg.role === "user";
              const isStreaming = !isUser && streamingId === msg.id;
              return (
                <motion.li
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group max-w-[88%] rounded-2xl px-4 py-2.5 text-[0.88rem] leading-relaxed ${
                    isUser
                      ? "ml-auto bg-orech-bronze/15 text-orech-ink"
                      : "mr-auto bg-orech-paper text-orech-mist/95 italic"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">
                      {msg.via === "voice" && (
                        <span
                          aria-label={tNeo("dictation.ariaLabel")}
                          title={tNeo("dictation.titleLabel")}
                          className="mr-1.5 inline-flex h-3.5 w-3.5 -mt-0.5 align-middle text-orech-bronze/70"
                        >
                          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                            <path d="M10 3a2.5 2.5 0 00-2.5 2.5v4a2.5 2.5 0 005 0v-4A2.5 2.5 0 0010 3z" fill="currentColor" />
                            <path d="M5 9.5a5 5 0 0010 0M10 14.5V17M7 17h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </span>
                      )}
                      {msg.content_redacted}
                    </p>
                  ) : isStreaming ? (
                    <NeoTypewriter
                      text={msg.content_redacted}
                      active
                      onComplete={() => markRevealed(msg.id)}
                    />
                  ) : (
                    <NeoRichText text={msg.content_redacted} />
                  )}

                  {!isUser && !isStreaming && meta && meta.citations.some((c) => c.href) && (
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] text-orech-mist">
                      {meta.citations
                        .filter((c) => c.href)
                        .map((c) => (
                          <Link
                            key={c.id}
                            href={c.href as string}
                            onClick={onNavigate}
                            className="text-orech-bronze underline-offset-2 hover:underline"
                          >
                            {c.title}
                          </Link>
                        ))}
                    </p>
                  )}

                  {!isUser && !isStreaming && meta && (
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(msg.content_redacted);
                      }}
                      className="mt-1 text-[0.65rem] text-orech-mist/0 transition group-hover:text-orech-mist hover:text-orech-bronze focus:text-orech-bronze"
                      aria-label="Copy reply"
                    >
                      {tNeo("message.copy")}
                    </button>
                  )}
                </motion.li>
              );
            })}

            {!isGenerating && !streamingId && lastMeta && lastMeta.followUps.length > 0 && (
              <li className="mr-auto flex flex-wrap gap-1.5 pl-1 pt-1">
                {lastMeta.followUps.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => submit(f.prompt)}
                    disabled={isGenerating}
                    className="rounded-full border border-orech-line bg-orech-paper/80 px-3 py-1 text-[0.74rem] text-orech-ink transition hover:border-orech-bronze/50 hover:text-orech-bronze disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {f.label}
                  </button>
                ))}
              </li>
            )}

            {isGenerating && (
              <motion.li
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mr-auto flex items-center gap-2 rounded-2xl bg-orech-paper px-4 py-3"
                aria-live="polite"
                aria-label={`NEO: ${typingHint}`}
              >
                <div className="flex gap-1.5" aria-hidden>
                  {[0, 0.15, 0.3].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-orech-bronze"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: d }}
                    />
                  ))}
                </div>
                <span className="text-[0.72rem] italic text-orech-mist/80">{typingHint}</span>
              </motion.li>
            )}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-orech-line bg-orech-paper px-3 py-3">
        {showAttach && uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {uploadedFiles.map((file, i) => (
              <span
                key={`${file}-${i}`}
                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-orech-line bg-orech-slate/80 py-1 pl-2.5 pr-1 text-[0.7rem] text-orech-mist"
              >
                <svg viewBox="0 0 20 20" width="11" height="11" aria-hidden className="shrink-0 text-orech-bronze">
                  <path d="M14 6l-7 7a3 3 0 104.2 4.2L18 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span className="truncate" title={file}>{file}</span>
                <button
                  type="button"
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-orech-mist hover:bg-orech-bronze/15 hover:text-orech-ink"
                  aria-label={tNeo("attach.remove", { file })}
                  onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <svg viewBox="0 0 20 20" width="9" height="9" aria-hidden>
                    <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {showAttach && attachError && (
          <p className="mb-2 rounded-md border border-red-300/60 bg-red-50 px-2.5 py-1 text-[0.7rem] text-red-600">
            {attachError}
          </p>
        )}

        {speech.listening && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-orech-bronze/10 px-2.5 py-1 text-[0.72rem] text-orech-bronze">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orech-bronze/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orech-bronze" />
            </span>
            <span>{tNeo("dictation.listening")}</span>
          </div>
        )}

        {speech.error === "not-allowed" && (
          <p className="mb-2 rounded-md border border-red-300/60 bg-red-50 px-2.5 py-1 text-[0.7rem] text-red-600">
            {tNeo("dictation.blocked")}
          </p>
        )}

        {showAttach && pasteOpen && (
          <div className="mb-2 rounded-xl border border-orech-bronze/40 bg-orech-paper/90 p-2.5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-[0.72rem] font-medium text-orech-ink">{tNeo("paste.title")}</p>
              <span className="text-[0.66rem] text-orech-mist">{tNeo("paste.subtitle")} <span className="font-mono">pasted-evidence-XXX.txt</span>
              </span>
            </div>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value.slice(0, 8000))}
              placeholder={tNeo("paste.placeholder")}
              aria-label="Paste evidence text"
              rows={5}
              className="w-full resize-y rounded-md border border-orech-line bg-white px-2 py-1.5 text-[0.78rem] leading-relaxed text-orech-ink outline-none focus:border-orech-bronze/60"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[0.66rem] text-orech-mist">
                {tNeo("paste.characters", { length: pasteValue.length })}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPasteOpen(false);
                    setPasteValue("");
                    setAttachError("");
                  }}
                  className="rounded-md border border-orech-line bg-white px-2 py-1 text-[0.7rem] text-orech-mist hover:text-orech-ink"
                >{tNeo("paste.cancel")}</button>
                <button
                  type="button"
                  onClick={commitPastedEvidence}
                  className="rounded-md border border-orech-bronze bg-orech-bronze px-2.5 py-1 text-[0.7rem] font-medium text-[#121212] transition hover:opacity-90"
                >{tNeo("paste.add")}</button>
              </div>
            </div>
          </div>
        )}

        <form
          className={`flex items-end gap-2 rounded-2xl border bg-orech-paper px-2 py-1.5 ${
            speech.listening
              ? "border-orech-bronze/70 ring-2 ring-orech-bronze/20"
              : "border-orech-line focus-within:border-orech-bronze/50"
          }`}
          onSubmit={(e) => {
            e.preventDefault();
            const t = input.trim();
            if (t) submit(t);
          }}
        >
          {showAttach && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-orech-mist transition hover:bg-orech-bronze/10 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
                aria-label={tNeo("attach.ariaLabel", { count: uploadedFiles.length, maxFiles: MAX_FILES })}
                title={tNeo("attach.title")}
              >
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
                  <path
                    d="M14 6l-7 7a3 3 0 104.2 4.2L18 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setPasteOpen((v) => !v)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze ${
                  pasteOpen
                    ? "bg-orech-bronze/15 text-orech-bronze"
                    : "text-orech-mist hover:bg-orech-bronze/10 hover:text-orech-bronze"
                }`}
                aria-label={tNeo("paste.openTitle")}
                aria-expanded={pasteOpen}
                title={tNeo("paste.openTitle")}
              >
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
                  <path
                    d="M7 4h6a1 1 0 011 1v1h2a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h2V5a1 1 0 011-1zm0 2v1h6V6H7z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                title={tNeo("attach.title")}
                aria-label="Attach document file picker"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          )}

          {speech.supported && (
            <button
              type="button"
              onClick={toggleDictation}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze ${
                speech.listening
                  ? "bg-orech-bronze text-[#121212] hover:opacity-95"
                  : "text-orech-mist hover:bg-orech-bronze/10 hover:text-orech-bronze"
              }`}
              aria-label={speech.listening ? tNeo("dictation.stop") : tNeo("dictation.start")}
              aria-pressed={speech.listening}
              title={speech.listening ? tNeo("dictation.stop") : tNeo("dictation.title")}
            >
              {speech.listening && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-orech-bronze/40 motion-safe:animate-ping"
                />
              )}
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden className="relative">
                <path
                  d="M10 3a2.5 2.5 0 00-2.5 2.5v4a2.5 2.5 0 005 0v-4A2.5 2.5 0 0010 3z"
                  fill="currentColor"
                />
                <path
                  d="M5 9.5a5 5 0 0010 0M10 14.5V17M7 17h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          <textarea
            ref={composerRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, COMPOSER_LIMIT))}
            placeholder={placeholder || tNeo("composerPlaceholder")}
            aria-label="Message"
            className="min-h-[36px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-[0.9rem] leading-relaxed text-orech-ink outline-none placeholder:text-orech-mist/70"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                const t = input.trim();
                if (t) submit(t);
              }
            }}
          />
          <button
            type="submit"
            disabled={isGenerating || input.trim().length === 0}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orech-bronze text-[#121212] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={tNeo("message.send")}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path d="M3 10l14-7-5 16-3-7-6-2z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}

function timeOfDayGreeting(tNeo: any): string {
  const h = new Date().getHours();
  if (h < 5) return tNeo("empty.greetingParams.hello");
  if (h < 12) return tNeo("empty.greetingParams.morning");
  if (h < 18) return tNeo("empty.greetingParams.afternoon");
  if (h < 22) return tNeo("empty.greetingParams.evening");
  return tNeo("empty.greetingParams.hello");
}

function EmptyState({ onPrompt, size, tNeo }: { onPrompt: (text: string) => void; size: "panel" | "workspace"; tNeo: any }) {
  // Render a stable greeting on the server, then upgrade to the time-of-day
  // version after mount. This avoids a hydration mismatch when SSR happens at
  // a different hour (or in a different time zone) than the client.
  const [greeting, setGreeting] = useState<string>("");
  useEffect(() => {
    setGreeting(timeOfDayGreeting(tNeo));
  }, [tNeo]);

  const QUICK_PROMPTS = [
    tNeo("quickPrompts.cases"),
    tNeo("quickPrompts.lawyers"),
    tNeo("quickPrompts.reach")
  ];

  return (
    <div className={`flex h-full flex-col justify-end gap-6 pb-2 ${size === "workspace" ? "max-w-xl" : ""}`}>
      <div className="space-y-1.5">
        <p className="font-display text-[1.05rem] text-orech-ink">{tNeo("empty.introTitle", { greeting: greeting || tNeo("empty.greetingParams.hello") })}</p>
        <p className="text-[0.85rem] leading-relaxed text-orech-mist">
          {size === "workspace"
            ? tNeo("empty.introWorkspace")
            : tNeo("empty.introPanel")}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {QUICK_PROMPTS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPrompt(q)}
              className="w-full rounded-xl border border-orech-line bg-orech-paper px-3 py-2 text-left text-[0.85rem] text-orech-ink transition hover:border-orech-bronze/50 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useNeo } from "./neo-context";
import { LAWYER_ASSISTANT_PERSONA } from "@/lib/neo/persona";
import { Link } from "@/i18n/routing";

import { NeoChatSurface } from "./neo-chat-surface";
import { NeoOrchestrator } from "./neo-orchestrator";
import { NEO_AGENTS } from "@/lib/neo/agents";
import { NeoAuth } from "./neo-auth";
import { NeoSubmitReview } from "./neo-submit-review";
import { NeoIntakeProgress } from "./neo-intake-progress";
import { INTAKE_ENABLED } from "@/lib/neo/intake-mode";

const PANEL_WIDTH_KEY = "neo_panel_width_v1";
const PANEL_MIN_W = 380;
const PANEL_DEFAULT_W = 420;
const PANEL_MAX_VW_RESERVE = 120;

export function NeoShell() {
  const {
    open,
    setOpen,
    toggle,
    messages,
    assistantMeta,
    isGenerating,
    state,
    setState,
    uploadedFiles,
    email,
    setEmail,
    dossier,
    setDossier,
    isSubmitting,
    readinessScore,
    resetConversation,
    startSummary,
    finalSubmit,
    selectedAgent,
    setSelectedAgent,
    lastRoutedAgent,
    showOrchestrator,
    setShowOrchestrator,
    orchestratorLive,
    lastSwarmMeta,
  } = useNeo();

  const panelId = useId();
  const railRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Resizable width (lg+ only). Persisted across sessions so the user's
  // preferred panel size sticks. The drag handle sits on the left edge.
  const [panelWidth, setPanelWidth] = useState<number>(PANEL_DEFAULT_W);
  const widthRef = useRef<number>(PANEL_DEFAULT_W);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    widthRef.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(PANEL_WIDTH_KEY);
      if (!v) return;
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n >= PANEL_MIN_W) {
        const cap = window.innerWidth - PANEL_MAX_VW_RESERVE;
        setPanelWidth(Math.min(n, Math.max(PANEL_MIN_W, cap)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startW = widthRef.current;

    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const onMove = (clientX: number) => {
      const delta = startX - clientX;
      const max = window.innerWidth - PANEL_MAX_VW_RESERVE;
      const next = Math.max(PANEL_MIN_W, Math.min(max, startW + delta));
      widthRef.current = next;
      setPanelWidth(next);
    };
    const onMouse = (ev: MouseEvent) => onMove(ev.clientX);
    const onTouch = (ev: TouchEvent) => {
      if (ev.touches.length === 0) return;
      onMove(ev.touches[0].clientX);
    };
    const stop = () => {
      document.removeEventListener("mousemove", onMouse);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", onTouch);
      document.removeEventListener("touchend", stop);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setIsResizing(false);
      try {
        localStorage.setItem(PANEL_WIDTH_KEY, String(widthRef.current));
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("mousemove", onMouse);
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchmove", onTouch, { passive: true });
    document.addEventListener("touchend", stop);
  }, []);

  const onResizeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let delta = 0;
      if (e.key === "ArrowLeft") delta = 24;
      else if (e.key === "ArrowRight") delta = -24;
      else if (e.key === "Home") {
        setPanelWidth(window.innerWidth - PANEL_MAX_VW_RESERVE);
        try {
          localStorage.setItem(PANEL_WIDTH_KEY, String(window.innerWidth - PANEL_MAX_VW_RESERVE));
        } catch {
          /* ignore */
        }
        return;
      } else if (e.key === "End") {
        setPanelWidth(PANEL_DEFAULT_W);
        try {
          localStorage.setItem(PANEL_WIDTH_KEY, String(PANEL_DEFAULT_W));
        } catch {
          /* ignore */
        }
        return;
      } else {
        return;
      }
      e.preventDefault();
      const max = window.innerWidth - PANEL_MAX_VW_RESERVE;
      const next = Math.max(PANEL_MIN_W, Math.min(max, panelWidth + delta));
      setPanelWidth(next);
      try {
        localStorage.setItem(PANEL_WIDTH_KEY, String(next));
      } catch {
        /* ignore */
      }
    },
    [panelWidth],
  );

  const applyHubLayout = useCallback(() => {
    const lg = window.matchMedia("(min-width: 1024px)").matches;
    document.body.classList.toggle("neo-hub-open", open && lg);
    if (lg) document.body.style.overflow = "";
    else document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    applyHubLayout();
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => applyHubLayout();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, applyHubLayout]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        railRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  const lastMeta = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === "assistant" && assistantMeta[m.id]) return assistantMeta[m.id];
    }
    return null;
  })();

  const degraded = lastMeta?.swarm.mode === "degraded" || lastMeta?.swarm.mode === "hydra_failed";
  const inIntakeFlow =
    state === "PENDING_EMAIL_VERIFICATION" ||
    state === "VERIFIED_READY_FOR_FINAL_REVIEW" ||
    state === "SUBMITTED_FOR_LEGAL_REVIEW";

  const transitionMs = reducedMotion ? 0 : 350;
  const easeNeo = "cubic-bezier(0.19, 1, 0.22, 1)";

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-orech-slate/80 transition-opacity lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ transitionDuration: `${transitionMs}ms` }}
        aria-hidden
        onClick={() => setOpen(false)}
      />

      <aside
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={open ? undefined : true}
        aria-label="NEO assistant"
        tabIndex={-1}
        className={`fixed bottom-0 top-0 z-[70] flex w-[min(calc(100vw-52px),420px)] flex-col overflow-hidden border-orech-line bg-orech-paper/95 text-left text-orech-ink shadow-neo-glass backdrop-blur-2xl backdrop-saturate-200 max-lg:rounded-l-3xl max-lg:border-l lg:right-0 lg:rounded-l-3xl lg:border-l ${
          open
            ? "pointer-events-auto translate-x-0 max-lg:right-[52px]"
            : "pointer-events-none translate-x-full max-lg:right-0"
        }`}
        style={{
          transition:
            reducedMotion || isResizing ? "none" : `transform ${transitionMs}ms ${easeNeo}`,
          ['--neo-panel-w' as string]: `${panelWidth}px`,
          width: isLg ? `${panelWidth}px` : undefined,
        }}
      >
        {/* Drag-to-resize handle, lg+ only */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize NEO panel"
          aria-valuemin={PANEL_MIN_W}
          aria-valuenow={panelWidth}
          tabIndex={open ? 0 : -1}
          onMouseDown={startResize}
          onTouchStart={startResize}
          onKeyDown={onResizeKeyDown}
          className="group absolute left-0 top-0 z-[71] hidden h-full w-1.5 cursor-ew-resize select-none items-center justify-center hover:bg-orech-bronze/30 focus-visible:bg-orech-bronze/40 focus-visible:outline-none lg:flex"
          title="Drag to resize · arrow keys to nudge"
        >
          <span
            aria-hidden
            className={`block h-10 w-[3px] rounded-full bg-orech-line transition group-hover:bg-orech-bronze group-focus-visible:bg-orech-bronze ${
              isResizing ? "bg-orech-bronze" : ""
            }`}
          />
        </div>
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-orech-line bg-orech-slate/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                degraded ? "bg-amber-400" : isGenerating ? "bg-orech-bronze" : "bg-emerald-400"
              }`}
              aria-hidden
            >
              {!reducedMotion && !degraded && (
                <span
                  className={`absolute inset-0 rounded-full ${
                    isGenerating ? "animate-ping bg-orech-bronze/60" : "animate-pulse bg-emerald-400/40"
                  }`}
                />
              )}
            </span>
            <div className="min-w-0">
              <p className="italic-display text-[1.15rem] leading-none">
                {LAWYER_ASSISTANT_PERSONA.displayName}
              </p>
              <p className="mt-1 text-[0.7rem] leading-none text-orech-mist">
                {isGenerating ? "Typing…" : degraded ? "Replying from cache" : "Online"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/case"
              onClick={() => setOpen(false)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-orech-mist transition hover:bg-orech-bronze/10 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
              aria-label="Open the Case Room (full-screen workspace)"
              title="Open the Case Room"
            >
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                <path
                  d="M3 11V3h8M17 9v8H9M11 3l6 6M9 17l-6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            {messages.length > 0 && !inIntakeFlow && (
              <button
                type="button"
                onClick={resetConversation}
                className="rounded-md px-2 py-1 text-[0.72rem] font-medium text-orech-mist transition hover:bg-orech-bronze/10 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
                aria-label="Start a new conversation"
              >
                New
              </button>
            )}
            <button
              ref={closeBtnRef}
              type="button"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-orech-mist transition hover:bg-orech-bronze/10 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
              onClick={() => {
                setOpen(false);
                railRef.current?.focus();
              }}
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {inIntakeFlow ? (
            <div className="flex-1 overflow-y-auto px-6 py-8">
              {state === "PENDING_EMAIL_VERIFICATION" && (
                <NeoAuth
                  email={email}
                  setEmail={setEmail}
                  onVerified={() => {
                    if (dossier) setDossier({ ...dossier, client: { ...dossier.client, verified_email: email } });
                    setState("VERIFIED_READY_FOR_FINAL_REVIEW");
                  }}
                  onCancel={() => setState("DRAFT_CASE_BUILDING")}
                />
              )}
              {state === "VERIFIED_READY_FOR_FINAL_REVIEW" && (
                <NeoSubmitReview
                  dossier={dossier}
                  loading={isSubmitting}
                  onSubmit={finalSubmit}
                  onCancel={() => setState("DRAFT_CASE_BUILDING")}
                />
              )}
              {state === "SUBMITTED_FOR_LEGAL_REVIEW" && (
                <div className="mx-auto w-full max-w-[320px] space-y-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-900/30">
                    <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-orech-ink">Sent to the office</h3>
                    <p className="mt-2 text-[0.78rem] text-orech-mist">
                      A lawyer will be in touch with you at <span className="text-orech-ink">{email}</span> if more
                      information is needed.
                    </p>
                  </div>
                  <button
                    onClick={resetConversation}
                    className="w-full rounded-lg border border-orech-bronze py-2.5 text-sm font-medium text-orech-bronze transition hover:bg-orech-bronze/10"
                  >
                    Start a new conversation
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-orech-line/80 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setShowOrchestrator(!showOrchestrator)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[0.72rem] font-medium text-orech-mist transition hover:bg-orech-bronze/5 hover:text-orech-ink"
                  aria-expanded={showOrchestrator}
                >
                  <span>Orchestrator · Metacognition</span>
                  <span className="font-mono text-[0.6rem] uppercase text-orech-bronze">
                    {showOrchestrator ? "Hide" : "Show"}
                  </span>
                </button>
                {showOrchestrator && (
                  <div className="mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-orech-line/60 bg-orech-slate/30 p-3">
                    <NeoOrchestrator
                      agents={NEO_AGENTS}
                      selectedAgent={selectedAgent}
                      activeRouted={lastRoutedAgent}
                      onSelect={setSelectedAgent}
                      metacognition={orchestratorLive.metacognition}
                      orchestratorReasoning={lastSwarmMeta?.orchestratorReasoning}
                      orchestratorConfidence={lastSwarmMeta?.orchestratorConfidence}
                      compact
                    />
                  </div>
                )}
              </div>
              <NeoChatSurface size="panel" onNavigate={() => setOpen(false)} />

              {INTAKE_ENABLED &&
                state === "DRAFT_CASE_BUILDING" &&
                messages.length >= 2 && (
                  <NeoIntakeProgress
                    score={readinessScore}
                    filesAssigned={uploadedFiles.length}
                    onProceed={startSummary}
                  />
                )}
            </>
          )}
        </div>
      </aside>

      <button
        ref={railRef}
        type="button"
        onClick={() => toggle()}
        aria-expanded={open ? "true" : "false"}
        aria-label="Open NEO assistant"
        aria-controls={panelId}
        className={`fixed right-0 top-1/2 z-[80] flex -translate-y-1/2 border border-orech-line border-r-0 bg-orech-paper py-6 pl-1.5 pr-1 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-orech-bronze shadow-[-4px_0_16px_rgba(0,0,0,0.5)] transition hover:pr-2 ${
          open ? "lg:hidden" : ""
        }`}
        style={{ writingMode: "vertical-rl", textOrientation: "mixed", borderRadius: "12px 0 0 12px" }}
      >
        Neo AI
      </button>
    </>
  );
}

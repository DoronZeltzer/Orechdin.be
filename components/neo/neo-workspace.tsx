"use client";

import { useEffect, useState } from "react";

import { Link } from "@/i18n/routing";
import { useNeo } from "./neo-context";
import { LAWYERS } from "@/lib/site";
import { LAWYER_ASSISTANT_PERSONA } from "@/lib/neo/persona";

import { NeoChatSurface } from "./neo-chat-surface";
import { NeoAuth } from "./neo-auth";
import { NeoSubmitReview } from "./neo-submit-review";
import { NeoIntakeProgress } from "./neo-intake-progress";
import { NeoDossierPanel } from "./neo-dossier-panel";
import { NeoOrchestrator } from "./neo-orchestrator";
import { NEO_AGENTS } from "@/lib/neo/agents";
import { INTAKE_ENABLED } from "@/lib/neo/intake-mode";

type MobileTab = "chat" | "dossier";

/**
 * Full-screen Case Room. Two-pane on desktop (chat left, dossier right),
 * tab-toggle on mobile. Pulls everything from NeoContext so the side panel
 * and this surface share one conversation - open it in either, the messages
 * follow you.
 */
export function NeoWorkspace() {
  const {
    messages,
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
    orchestratorLive,
    lastSwarmMeta,
  } = useNeo();

  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  useEffect(() => {
    document.body.classList.add("neo-case-room");
    return () => {
      document.body.classList.remove("neo-case-room");
    };
  }, []);

  const inIntakeFlow =
    state === "PENDING_EMAIL_VERIFICATION" ||
    state === "VERIFIED_READY_FOR_FINAL_REVIEW" ||
    state === "SUBMITTED_FOR_LEGAL_REVIEW";

  const lawyerNames = LAWYERS.map((l) => l.name).join(" · ");

  return (
    <div className="flex h-[calc(100dvh-69px)] sm:h-[calc(100dvh-73px)] w-full flex-col bg-orech-slate text-orech-ink">
      {/* Top strip: minimal context, exit back to site. Quiet, professional. */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-orech-line bg-orech-paper/80 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-orech-mist transition hover:bg-orech-bronze/10 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
            aria-label="Back to the site"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
              <path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="font-display text-[1rem] leading-none text-orech-ink">Case Room</p>
            <p className="mt-1 truncate text-[0.7rem] leading-none text-orech-mist">
              with Neo AI assistant of · Lawyers {lawyerNames}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile tab toggle */}
          <div className="flex rounded-full border border-orech-line bg-orech-paper p-0.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              aria-pressed={mobileTab === "chat"}
              className={`rounded-full px-3 py-1 text-[0.74rem] transition ${
                mobileTab === "chat" ? "bg-orech-bronze text-[#121212]" : "text-orech-mist"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("dossier")}
              aria-pressed={mobileTab === "dossier"}
              className={`rounded-full px-3 py-1 text-[0.74rem] transition ${
                mobileTab === "dossier" ? "bg-orech-bronze text-[#121212]" : "text-orech-mist"
              }`}
            >
              Dossier
            </button>
          </div>
          {messages.length > 0 && !inIntakeFlow && (
            <button
              type="button"
              onClick={resetConversation}
              className="rounded-md px-2 py-1 text-[0.74rem] font-medium text-orech-mist transition hover:bg-orech-bronze/10 hover:text-orech-bronze focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze"
            >
              New conversation
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 lg:divide-x lg:divide-orech-line">
        {/* CHAT PANE */}
        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${mobileTab === "chat" ? "" : "hidden lg:flex"}`}
          aria-label="Conversation with NEO"
        >
          {inIntakeFlow ? (
            <div className="flex-1 overflow-y-auto px-6 py-10">
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
                <div className="mx-auto w-full max-w-md space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-900/30">
                    <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-orech-ink">Your file is with the office</h3>
                    <p className="mt-2 text-[0.85rem] text-orech-mist">
                      A lawyer will be in touch with you at <span className="text-orech-ink">{email}</span> if more
                      information is needed.
                    </p>
                  </div>
                  <button
                    onClick={resetConversation}
                    className="rounded-lg border border-orech-bronze px-4 py-2.5 text-sm font-medium text-orech-bronze transition hover:bg-orech-bronze/10"
                  >
                    Start a new conversation
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NeoChatSurface
                size="workspace"
                placeholder="Take your time - write, or drop a document into the chat."
              />

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
        </section>

        {/* DOSSIER PANE */}
        <section
          className={`min-h-0 w-full lg:w-[380px] xl:w-[420px] ${mobileTab === "dossier" ? "" : "hidden lg:block"}`}
          aria-label="Live dossier"
        >
          <div className="border-b border-orech-line px-4 py-4 lg:px-5">
            <NeoOrchestrator
              agents={NEO_AGENTS}
              selectedAgent={selectedAgent}
              activeRouted={lastRoutedAgent}
              onSelect={setSelectedAgent}
              metacognition={orchestratorLive.metacognition}
              orchestratorReasoning={lastSwarmMeta?.orchestratorReasoning}
              orchestratorConfidence={lastSwarmMeta?.orchestratorConfidence}
            />
          </div>
          <NeoDossierPanel />
        </section>
      </div>

      {/* Bottom helper bar - quiet, no contact info. */}
      <footer className="shrink-0 border-t border-orech-line bg-orech-paper/60 px-4 py-2 text-[0.7rem] text-orech-mist lg:px-8">
        <p>
          NEO orients only and is not a legal opinion. When you press{" "}
          <span className="text-orech-ink">Submit</span>, the dossier is sent to the office for review.
          {isGenerating && <span className="ml-2">NEO is typing…</span>}
        </p>
      </footer>
    </div>
  );
}

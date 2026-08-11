"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocale } from "next-intl";
import type { NeoAgentId } from "@/lib/neo/types";
import {
  composeNeoReply,
  type NeoCitation,
  type SwarmExecutionReceipt,
} from "@/lib/neo/compose-reply";
import type { SuggestedFollowUp } from "@/lib/neo/legal-reply";
import {
  IntakeState,
  IntakeMessage,
  IntakeDraft,
} from "@/lib/neo/intake-types";
import { calculateReadiness, type ReadinessMetrics, type MetacognitiveReport } from "@/lib/neo/intake-state";
import { liveOrchestratorSnapshot } from "@/lib/neo/orchestrator-intelligence";
import { NEO_AGENTS } from "@/lib/neo/agents";
import { CaseDossier, generateIntakeSummary } from "@/lib/neo/intake-summary";
import { submitDossierForReview } from "@/server/actions/neo-submit-intake";

const STORAGE_KEY = "neo_sidebar_open_v1";

function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/** Per-message UI metadata kept on the client. */
export type AssistantMeta = {
  citations: NeoCitation[];
  swarm: SwarmExecutionReceipt;
  followUps: SuggestedFollowUp[];
};

export interface NeoContextValue {
  // Surface
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  selectedAgent: NeoAgentId;
  setSelectedAgent: (a: NeoAgentId) => void;
  lastRoutedAgent: Exclude<NeoAgentId, "auto">;
  showOrchestrator: boolean;
  setShowOrchestrator: (v: boolean) => void;
  orchestratorLive: {
    metacognition: MetacognitiveReport;
    activeAgent: Exclude<NeoAgentId, "auto">;
    nextAction: string;
  };
  lastSwarmMeta: SwarmExecutionReceipt | null;

  // Conversation
  messages: IntakeMessage[];
  assistantMeta: Record<string, AssistantMeta>;
  isGenerating: boolean;
  state: IntakeState;
  setState: (s: IntakeState) => void;

  // Intake artifacts
  uploadedFiles: string[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  email: string;
  setEmail: (e: string) => void;
  dossier: CaseDossier | null;
  setDossier: (d: CaseDossier | null) => void;
  isSubmitting: boolean;
  readinessScore: number;

  // Actions
  sendMessage: (text: string, options?: { via?: "voice" | "keyboard" }) => Promise<void>;
  resetConversation: () => void;
  startSummary: () => void;
  finalSubmit: (consents: { rep_understanding: boolean; info_auth: boolean; use_consent: boolean }) => Promise<void>;
}

const NeoContext = createContext<NeoContextValue | null>(null);

export function NeoProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  // Surface state
  const [open, setOpenState] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<NeoAgentId>("auto");
  const [lastRoutedAgent, setLastRoutedAgent] = useState<Exclude<NeoAgentId, "auto">>("legal-guide");
  const [showOrchestrator, setShowOrchestrator] = useState(false);

  // Conversation state (lifted out of the side panel so the Case Room can share it).
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [assistantMeta, setAssistantMeta] = useState<Record<string, AssistantMeta>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [state, setState] = useState<IntakeState>("DRAFT_DISCOVERY");

  // Intake artifacts
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [dossier, setDossier] = useState<CaseDossier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setOpenState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  const sendMessage = useCallback(
    async (raw: string, options?: { via?: "voice" | "keyboard" }) => {
      const text = raw.trim();
      if (!text || isGenerating) return;

      const userMsg: IntakeMessage = {
        id: safeUUID(),
        intake_draft_id: "draft-1",
        role: "user",
        content_redacted: text,
        timestamp: new Date().toISOString(),
        sequence_no: messages.length + 1,
        via: options?.via ?? "keyboard",
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsGenerating(true);

      try {
        // Run the reply generation and an artificial "thinking" delay in
        // parallel.  The minimum delay makes NEO feel more contemplative and
        // human - the indicator stays visible for at least 1.8 – 3.5 s.
        const THINK_MIN_MS = 1800;
        const THINK_MAX_MS = 3500;
        const thinkMs = THINK_MIN_MS + Math.random() * (THINK_MAX_MS - THINK_MIN_MS);

        const [out] = await Promise.all([
          composeNeoReply({
            message: text,
            selectedAgent,
            currentState: state,
            uploadedFiles,
            messageHistory: nextMessages.map((m) => ({ role: m.role, content: m.content_redacted })),
            locale,
          }),
          new Promise((r) => setTimeout(r, thinkMs)),
        ]);

        const replyId = safeUUID();
        const replyText =
          out.text?.trim() ||
          (locale === "nl"
            ? "Ik kan daar nu geen antwoord op geven op basis van het gepubliceerde materiaal. Probeer het opnieuw of neem contact op met het kantoor."
            : locale === "fr"
              ? "Je ne peux pas répondre pour l'instant à partir du matériel publié. Réessayez ou contactez le cabinet."
              : "I cannot answer that from published material right now. Please try again or contact the office.");

        if (out.swarmMeta.routedAgent) {
          const match = NEO_AGENTS.find((a) => a.label === out.swarmMeta.routedAgent);
          if (match) setLastRoutedAgent(match.id);
        }

        const replyMsg: IntakeMessage = {
          id: replyId,
          intake_draft_id: "draft-1",
          role: "assistant",
          content_redacted: replyText,
          timestamp: new Date().toISOString(),
          sequence_no: nextMessages.length + 1,
        };

        setMessages((m) => [...m, replyMsg]);
        setAssistantMeta((meta) => ({
          ...meta,
          [replyId]: { citations: out.citations, swarm: out.swarmMeta, followUps: out.followUps },
        }));
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : "unknown";
        console.error(e);
        setMessages((m) => [
          ...m,
          {
            id: safeUUID(),
            intake_draft_id: "draft-1",
            role: "assistant",
            content_redacted: `Sorry - I couldn't reach my system just now (${errMsg}). Please try again, or reach the office directly.`,
            timestamp: new Date().toISOString(),
            sequence_no: nextMessages.length + 1,
          },
        ]);
      } finally {
        setIsGenerating(false);
      }

      if (state === "DRAFT_DISCOVERY" && (messages.length >= 2 || uploadedFiles.length > 0)) {
        setState("DRAFT_CASE_BUILDING");
      }
    },
    [isGenerating, messages, selectedAgent, state, uploadedFiles, locale],
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setAssistantMeta({});
    setUploadedFiles([]);
    setDossier(null);
    setEmail("");
    setState("DRAFT_DISCOVERY");
    setLastRoutedAgent("legal-guide");
  }, []);

  const readinessInput: ReadinessMetrics = useMemo(
    () => ({
      hasIssue: messages.length > 1,
      hasTimeline: messages.some((m) =>
        /\b(ago|last|month|year|week|day|when|since)\b/i.test(m.content_redacted),
      ),
      hasNamedParty: messages.some((m) =>
        /\b(company|person|employer|landlord|tenant|spouse|partner|bank)\b/i.test(m.content_redacted),
      ),
      hasLocation: messages.some((m) =>
        /\b(antwerp|belgium|brussels|ghent|flanders|court)\b/i.test(m.content_redacted),
      ),
      fileCount: uploadedFiles.length,
      explicitRequest: true,
    }),
    [messages, uploadedFiles],
  );
  const readinessScore = useMemo(() => calculateReadiness(readinessInput), [readinessInput]);

  const startSummary = useCallback(async () => {
    setState("PENDING_EMAIL_VERIFICATION");
    setIsGenerating(true);

    const mockDraft: IntakeDraft = {
      id: "draft-1",
      session_id: "sesh-x",
      status: "PENDING_EMAIL_VERIFICATION",
      language: "English",
      readiness_score: readinessScore,
      created_at: "",
      updated_at: "",
      expires_at: "",
    };

    try {
      const resultDossier = await generateIntakeSummary(
        mockDraft,
        messages,
        uploadedFiles.map((f) => ({
          id: f,
          temp_file_id: f,
          original_filename: f,
          intake_draft_id: "1",
          mime_type: "pdf",
          byte_size: 100,
          storage_status: "PENDING",
          extraction_status: "PENDING",
          malware_status: "PASSED",
          created_at: "",
        })),
        { email: email || "pending@client.com" },
      );
      setDossier(resultDossier);
    } catch (err) {
      console.error("Failed to generate dossier summary:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [readinessScore, messages, uploadedFiles, email]);

  const finalSubmit = useCallback(
    async (consents: { rep_understanding: boolean; info_auth: boolean; use_consent: boolean }) => {
      setIsSubmitting(true);
      try {
        await submitDossierForReview("draft-1", consents, email);
        setState("SUBMITTED_FOR_LEGAL_REVIEW");
      } catch {
        alert("Submission failed. Ensure backend runs.");
      }
      setIsSubmitting(false);
    },
    [email],
  );

  const orchestratorLive = useMemo(
    () =>
      liveOrchestratorSnapshot({
        messages,
        currentState: state,
        uploadedFiles,
        selectedAgent,
        lastRoutedAgent,
      }),
    [messages, state, uploadedFiles, selectedAgent, lastRoutedAgent],
  );

  const lastSwarmMeta = useMemo(() => {
    const ids = Object.keys(assistantMeta);
    if (ids.length === 0) return null;
    return assistantMeta[ids[ids.length - 1]]?.swarm ?? null;
  }, [assistantMeta]);

  const value = useMemo<NeoContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      selectedAgent,
      setSelectedAgent,
      lastRoutedAgent,
      showOrchestrator,
      setShowOrchestrator,
      messages,
      assistantMeta,
      isGenerating,
      state,
      setState,
      uploadedFiles,
      setUploadedFiles,
      email,
      setEmail,
      dossier,
      setDossier,
      isSubmitting,
      readinessScore,
      sendMessage,
      resetConversation,
      startSummary,
      finalSubmit,
      orchestratorLive,
      lastSwarmMeta,
    }),
    [
      open,
      setOpen,
      toggle,
      selectedAgent,
      lastRoutedAgent,
      showOrchestrator,
      messages,
      assistantMeta,
      isGenerating,
      state,
      uploadedFiles,
      email,
      dossier,
      isSubmitting,
      readinessScore,
      sendMessage,
      resetConversation,
      startSummary,
      finalSubmit,
      orchestratorLive,
      lastSwarmMeta,
    ],
  );

  return <NeoContext.Provider value={value}>{children}</NeoContext.Provider>;
}

export function useNeo() {
  const ctx = useContext(NeoContext);
  if (!ctx) throw new Error("useNeo requires NeoProvider");
  return ctx;
}

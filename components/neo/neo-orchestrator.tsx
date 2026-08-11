"use client";

import type { MetacognitiveReport } from "@/lib/neo/intake-state";
import type { NeoAgent, NeoAgentId } from "@/lib/neo/types";
import { agentById } from "@/lib/neo/agents";

const TIER_LABEL: Record<NeoAgent["tier"], string> = {
  orientation: "Orientation",
  routing: "Routing",
  reference: "Reference",
};

const UNCERTAINTY_STYLE: Record<
  MetacognitiveReport["uncertaintyLevel"],
  string
> = {
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  MEDIUM: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  HIGH: "text-rose-300 bg-rose-500/10 border-rose-500/25",
};

export function NeoOrchestrator({
  agents,
  selectedAgent,
  activeRouted,
  onSelect,
  metacognition,
  orchestratorReasoning,
  orchestratorConfidence,
  compact = false,
}: {
  agents: NeoAgent[];
  selectedAgent: NeoAgentId;
  activeRouted: Exclude<NeoAgentId, "auto">;
  onSelect: (id: NeoAgentId) => void;
  metacognition?: MetacognitiveReport;
  orchestratorReasoning?: string;
  orchestratorConfidence?: number;
  compact?: boolean;
}) {
  const active = agentById(activeRouted);

  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-orech-mist">
          Swarm orchestrator
        </p>
        {!compact && (
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-orech-mist/90">
            Intelligent routing uses your intent, conversation gaps, and metacognition -
            not just keywords.
          </p>
        )}
      </div>

      {metacognition && (
        <MetacognitionPanel
          report={metacognition}
          reasoning={orchestratorReasoning}
          confidence={orchestratorConfidence}
          activeLabel={active?.label}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <AutoModeChip
          selected={selectedAgent === "auto"}
          onSelect={() => onSelect("auto")}
        />
      </div>

      {!compact && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="list">
          {agents.map((a) => (
            <li key={a.id} role="listitem">
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                aria-pressed={selectedAgent === a.id}
                className={`flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze ${
                  selectedAgent === a.id
                    ? "border-orech-bronze/50 bg-gradient-to-br from-orech-bronze/[0.08] to-orech-slate/80"
                    : "border-orech-line bg-orech-slate/50 hover:border-orech-bronze/25"
                }`}
              >
                <span className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-orech-bronze">
                  {TIER_LABEL[a.tier]}
                </span>
                <span className="mt-0.5 font-display text-[0.88rem] text-orech-ink">{a.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <p
          className="rounded-xl border border-orech-bronze/15 bg-orech-slate/90 px-3 py-2 text-[0.74rem] leading-relaxed text-orech-mist"
          role="status"
        >
          <span className="font-semibold text-orech-bronze">Active node: </span>
          {active.label}
          {orchestratorReasoning ? (
            <span className="mt-1 block text-[0.68rem] text-orech-mist/80">{orchestratorReasoning}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}

function MetacognitionPanel({
  report,
  reasoning,
  confidence,
  activeLabel,
}: {
  report: MetacognitiveReport;
  reasoning?: string;
  confidence?: number;
  activeLabel?: string;
}) {
  return (
    <div
      className="rounded-xl border border-orech-line bg-orech-slate/60 px-3 py-2.5"
      role="region"
      aria-label="Orchestrator metacognition"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-orech-bronze">
          Metacognition
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[0.58rem] font-semibold uppercase ${UNCERTAINTY_STYLE[report.uncertaintyLevel]}`}
        >
          {report.uncertaintyLevel}
        </span>
        {typeof confidence === "number" && (
          <span className="font-mono text-[0.58rem] text-orech-mist">
            {Math.round(confidence * 100)}% route confidence
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[0.68rem] text-orech-mist">
        <div>
          <span className="text-orech-mist/70">Known facts</span>
          <p className="font-medium text-orech-ink">{report.knownFacts}/5</p>
        </div>
        <div>
          <span className="text-orech-mist/70">Dossier</span>
          <p className="font-medium text-orech-ink">{report.summaryCompleteness}%</p>
        </div>
      </div>

      {report.missingCritical.length > 0 && (
        <p className="mt-2 text-[0.68rem] text-orech-mist">
          <span className="font-medium text-amber-200/90">Gap: </span>
          {report.missingCritical[0]}
        </p>
      )}

      <p className="mt-1.5 text-[0.68rem] italic text-orech-mist/85">
        Next: {report.nextBestAction}
      </p>

      {activeLabel && reasoning && (
        <p className="mt-1.5 border-t border-orech-line/60 pt-1.5 text-[0.65rem] text-orech-mist/75">
          {reasoning}
        </p>
      )}

      {report.repeatedQuestionRisk && (
        <p className="mt-1 text-[0.65rem] text-amber-200/80">Repeated question pattern detected.</p>
      )}
    </div>
  );
}

function AutoModeChip({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-orech-bronze ${
        selected
          ? "border-orech-bronze bg-orech-bronze/12 text-orech-ink"
          : "border-orech-line text-orech-mist hover:border-orech-bronze/40"
      }`}
    >
      Auto · Intelligent
    </button>
  );
}

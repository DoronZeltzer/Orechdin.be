"use client";

import { useMemo, useState, useCallback } from "react";
import { Shield, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { useNeo } from "./neo-context";
import {
  buildCaseFile,
  buildCaseFilePreview,
} from "@/lib/neo/case-file-builder";
import {
  caseFileFilename,
  caseFileToMarkdown,
} from "@/lib/neo/case-file-export";
import { INTAKE_ENABLED } from "@/lib/neo/intake-mode";
import {
  DeliveryChannelModal,
  type DeliveryChannel,
  type DeliveryPayload,
} from "./delivery-channel-modal";
import { SITE } from "@/lib/site";
import type {
  CaseFile,
  CaseFilePreview,
  ChronologyEntry,
  DamageEntry,
  ExhibitEntry,
  LegalIssue,
  PartyEntry,
  ProceduralEntry,
} from "@/lib/neo/case-file-types";

/**
 * Live structured case file rendered in the dossier sidebar.
 *
 * Reads from NeoContext, runs the deterministic builder, and presents the
 * sections in the order a partner expects (cover → exec summary → risk
 * gate → parties → chronology → issues → exhibits → procedural → damages
 * → open questions → OVB allocation).
 *
 * Exposes "Copy as Markdown", "Download Markdown", and "Download JSON"
 * actions so the lawyer can drop the file straight into the matter folder.
 */
export function NeoCaseFileView() {
  const { messages, uploadedFiles } = useNeo();
  const t = useTranslations("NeoCaseFile");

  const filesForExtractor = useMemo(
    () =>
      uploadedFiles.map((f) => ({
        original_filename: f,
        mime_type: "application/octet-stream",
        storage_status: "PENDING",
      })),
    [uploadedFiles],
  );

  const preview = useMemo<CaseFilePreview>(
    () =>
      buildCaseFilePreview({
        language: "English",
        messages,
        files: filesForExtractor,
      }),
    [messages, filesForExtractor],
  );

  type Status =
    | { kind: "idle" }
    | { kind: "working"; label: string }
    | { kind: "ok"; label: string }
    | { kind: "error"; label: string };
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [deliveredVia, setDeliveredVia] = useState<DeliveryChannel | null>(
    null,
  );

  const buildFullForExport = (): CaseFile =>
    buildCaseFile({
      matterId: "draft-1",
      language: preview.cover.language,
      messages,
      files: filesForExtractor,
    });

  // --- Multi-channel delivery (hooks MUST be before any early return) ---
  const deliveryPayload = useMemo<DeliveryPayload>(() => {
    const cf = buildFullForExport();
    const md = caseFileToMarkdown(cf);
    return {
      markdownBody: md,
      subject: `Case File - ${cf.cover.caption} [${cf.cover.matterId}]`,
      recipientEmail: SITE.email,
      reference: cf.cover.matterId,
    };
    // Recalculate whenever the preview changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  const openDeliverModal = useCallback(() => {
    setDeliverOpen(true);
  }, []);

  const onDelivered = useCallback(
    (channel: DeliveryChannel) => {
      setDeliveredVia(channel);
      setDeliverOpen(false);
      setStatus({
        kind: "ok",
        label: t("deliveredSuccess"),
      });
      setTimeout(() => setStatus({ kind: "idle" }), 6000);
    },
    [t],
  );

  if (messages.length === 0) {
    return (
      <div className="space-y-3 px-1 print:hidden">
        <p className="text-[0.78rem] leading-relaxed text-orech-mist">
          {t("emptyIntro")}
        </p>
        <p className="text-[0.74rem] italic text-orech-mist/70">
          {t("emptyWarning")}
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-md border border-orech-bronze/30 bg-orech-bronze/5 p-3">
          <Shield
            className="h-5 w-5 shrink-0 text-orech-bronze"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wider text-orech-bronze">
              {t("cryptoHeading")}
            </p>
            <p className="text-[0.72rem] leading-relaxed text-orech-mist">
              {t.rich("cryptoSafetyText", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // buildFullForExport is now declared before the early return above

  const requestArtefact = async (format: "pdf" | "docx") => {
    const label = format === "pdf" ? "PDF" : "Word";
    setStatus({ kind: "working", label: `Preparing ${label}…` });
    try {
      const res = await fetch("/api/neo/case-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          language: preview.cover.language,
          messages,
          files: filesForExtractor,
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const cf = buildFullForExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = caseFileFilename(cf, format);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      setStatus({ kind: "ok", label: `${label} downloaded.` });
    } catch (e) {
      console.error(e);
      setStatus({
        kind: "error",
        label: `Couldn't generate ${label}. Try again or contact the office directly.`,
      });
    }
    setTimeout(() => setStatus({ kind: "idle" }), 3500);
  };


  const sendToOffice = async () => {
    setStatus({ kind: "working", label: "Sending brief to Orechdin…" });
    try {
      const res = await fetch("/api/neo/case-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          send: true,
          language: preview.cover.language,
          messages,
          files: filesForExtractor,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        message?: string;
        mode?: string;
      };
      if (!res.ok || !data.ok) {
        const reason = data.message ?? `Server returned ${res.status}.`;
        setStatus({ kind: "error", label: reason });
      } else {
        const ref = data.reference ?? "-";
        setStatus({
          kind: "ok",
          label: `Brief queued (ref ${ref}). You'll hear from Orechdin within 2 business days.`,
        });
      }
    } catch (e) {
      console.error(e);
      setStatus({
        kind: "error",
        label: "Couldn't reach the office. Try again in a moment.",
      });
    }
    setTimeout(() => setStatus({ kind: "idle" }), 6000);
  };

  return (
    <div className="space-y-5 case-file-printable">
      <CoverBlock preview={preview} />
      <ExecutiveSummaryBlock preview={preview} />
      <RiskGateBlock preview={preview} />
      <PartiesBlock parties={preview.parties} />
      <ChronologyBlock chronology={preview.chronology} />
      <IssuesBlock issues={preview.issues} caseTheory={preview.caseTheory} />
      <ExhibitsBlock exhibits={preview.exhibits} />
      <ProceduralBlock procedural={preview.procedural} />
      <DamagesBlock
        damages={preview.damages.entries}
        totalEurMinor={preview.damages.totalEurMinor}
      />
      <OpenQuestionsBlock items={preview.openQuestionsForLawyer} />
      <ExportActions
        status={status}
        onDownloadPdf={() => requestArtefact("pdf")}
        onDownloadDocx={() => requestArtefact("docx")}
        onSend={sendToOffice}
        onDeliver={openDeliverModal}
        canSend={INTAKE_ENABLED}
        deliveredVia={deliveredVia}
      />

      {/* Multi-channel delivery modal */}
      <DeliveryChannelModal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        payload={deliveryPayload}
        onDelivered={onDelivered}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section blocks
// ---------------------------------------------------------------------------

function CoverBlock({ preview }: { preview: CaseFilePreview }) {
  const t = useTranslations("NeoCaseFile");
  const urgencyTone =
    preview.cover.urgency === "CRITICAL"
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : preview.cover.urgency === "HIGH"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : preview.cover.urgency === "MEDIUM"
          ? "bg-orech-bronze/15 text-orech-bronze border-orech-bronze/30"
          : "bg-orech-slate/40 text-orech-mist border-orech-line";

  return (
    <section className="space-y-2 rounded-lg border border-orech-line bg-orech-paper/80 p-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-orech-mist">
        {t("cover")}
      </p>
      <h3 className="font-display text-[1rem] leading-snug text-orech-ink">
        {preview.cover.caption}
      </h3>
      <p className="text-[0.74rem] italic leading-relaxed text-orech-mist">
        {preview.cover.theme}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Chip label={preview.cover.practiceArea} />
        <span
          className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${urgencyTone}`}
        >
          {preview.cover.urgency}
        </span>
        {preview.cover.suggestedLead && (
          <Chip label={`Lead: ${preview.cover.suggestedLead}`} />
        )}
      </div>
      {preview.cover.statuteOfLimitationsAlert && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[0.72rem] text-amber-200">
          ⚠ {preview.cover.statuteOfLimitationsAlert}
        </p>
      )}
      {preview.cover.nextDeadline && (
        <p className="text-[0.72rem] text-orech-mist">
          {t("nextDeadline")}{" "}
          <span className="font-mono text-orech-ink">
            {preview.cover.nextDeadline}
          </span>
        </p>
      )}
      <CompletenessBar score={preview.completeness.score} />
    </section>
  );
}

function ExecutiveSummaryBlock({ preview }: { preview: CaseFilePreview }) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section title={t("execSummary")} subtitle={t("execSummarySubtitle")}>
      <p className="text-[0.78rem] leading-relaxed text-orech-ink">
        {preview.executiveSummary.paragraph}
      </p>
      <ul className="mt-1.5 space-y-0.5 text-[0.72rem] text-orech-mist">
        {preview.executiveSummary.bullets.map((b, i) => (
          <li key={i}>· {b}</li>
        ))}
      </ul>
    </Section>
  );
}

function RiskGateBlock({ preview }: { preview: CaseFilePreview }) {
  const t = useTranslations("NeoCaseFile");
  const r = preview.risk;
  const empty =
    r.conflictFlags.length === 0 &&
    !r.sensitiveMatter &&
    !r.jurisdictionRisk &&
    !r.concurrentCounselMentioned;

  return (
    <Section
      title={t("riskGate")}
      subtitle={empty ? t("riskNoSignal") : t("riskReviewReq")}
    >
      {empty ? (
        <Empty>{t("riskEmpty")}</Empty>
      ) : (
        <ul className="space-y-1.5 text-[0.74rem]">
          {r.conflictFlags.map((f) => (
            <li
              key={f.id}
              className="rounded-md border border-orech-line bg-orech-paper/80 px-2 py-1.5"
            >
              <p className="font-medium text-orech-ink">
                <SeverityBadge severity={f.severity} /> {f.label}
              </p>
              <p className="mt-1 text-[0.7rem] text-orech-mist">{f.reason}</p>
            </li>
          ))}
          {r.sensitiveMatter && (
            <RiskLine text="Sensitive subject-matter cue → apply firm's sensitive-matter protocol." />
          )}
          {r.jurisdictionRisk && (
            <RiskLine text="Possible out-of-jurisdiction matter → confirm Belgian competence." />
          )}
          {r.concurrentCounselMentioned && (
            <RiskLine text="Visitor mentioned existing counsel → verify no double representation." />
          )}
        </ul>
      )}
      <details className="mt-2 text-[0.72rem]">
        <summary className="cursor-pointer text-orech-mist hover:text-orech-bronze">
          {t("preEngagement", { count: r.preEngagementChecks.length })}
        </summary>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-orech-mist">
          {r.preEngagementChecks.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </details>
    </Section>
  );
}

function PartiesBlock({ parties }: { parties: PartyEntry[] }) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section
      title={t("parties")}
      subtitle={parties.length === 0 ? "-" : `${parties.length}`}
    >
      {parties.length === 0 ? (
        <Empty>{t("partiesEmpty")}</Empty>
      ) : (
        <ul className="space-y-1.5">
          {parties.map((p) => (
            <li
              key={p.id}
              className="rounded-md border border-orech-line bg-orech-paper/80 px-2 py-1.5 text-[0.74rem]"
            >
              <p className="text-orech-ink">
                <span className="mr-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-orech-mist">
                  {p.role}
                </span>
                {p.name}
              </p>
              {p.relationship && (
                <p className="text-[0.68rem] text-orech-mist">
                  {p.relationship}
                </p>
              )}
              <SourceBadge ref={p.source} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ChronologyBlock({ chronology }: { chronology: ChronologyEntry[] }) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section
      title={t("chronology")}
      subtitle={
        chronology.length === 0
          ? "-"
          : chronology.length === 1
            ? t("chronologyEvent", { count: 1 })
            : t("chronologyEvents", { count: chronology.length })
      }
    >
      {chronology.length === 0 ? (
        <Empty>{t("chronologyEmpty")}</Empty>
      ) : (
        <ol className="space-y-1.5">
          {chronology.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-orech-line bg-orech-paper/80 px-2 py-1.5 text-[0.74rem]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[0.7rem] text-orech-bronze">
                  {c.dateIso ?? c.dateText}
                </span>
                {c.dateIso && c.dateIso !== c.dateText && (
                  <span className="text-[0.66rem] italic text-orech-mist">
                    &ldquo;{c.dateText}&rdquo;
                  </span>
                )}
              </div>
              <p className="mt-1 text-orech-ink">{c.event}</p>
              <SourceBadge ref={c.source} />
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function IssuesBlock({
  issues,
  caseTheory,
}: {
  issues: LegalIssue[];
  caseTheory: CaseFilePreview["caseTheory"];
}) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section title={t("issues")} subtitle={`${issues.length}`}>
      {issues.length === 0 ? (
        <Empty>{t("issuesEmpty")}</Empty>
      ) : (
        <ul className="space-y-2">
          {issues.map((iss, i) => (
            <li
              key={iss.id}
              className="rounded-md border border-orech-line bg-orech-paper/80 px-2 py-1.5 text-[0.74rem]"
            >
              <p className="font-medium text-orech-ink">
                <span className="mr-1.5 font-mono text-[0.62rem] text-orech-mist">
                  #{i + 1}
                </span>
                {iss.question}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Chip label={iss.area} />
                <Chip label={`strength: ${iss.strength.toLowerCase()}`} />
              </div>
              {iss.openQuestions.length > 0 && (
                <details className="mt-1.5 text-[0.7rem]">
                  <summary className="cursor-pointer text-orech-mist hover:text-orech-bronze">
                    {t("openQuestions", { count: iss.openQuestions.length })}
                  </summary>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-orech-mist">
                    {iss.openQuestions.map((q, j) => (
                      <li key={j}>{q}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
      <details className="mt-2 text-[0.72rem]">
        <summary className="cursor-pointer text-orech-mist hover:text-orech-bronze">
          Case theory (NITA framework - intake hypothesis only)
        </summary>
        <dl className="mt-1.5 space-y-1 text-[0.7rem] text-orech-mist">
          <div>
            <dt className="font-medium text-orech-ink">{t("legalTheory")}</dt>
            <dd>{caseTheory.legalTheory}</dd>
          </div>
          <div>
            <dt className="font-medium text-orech-ink">{t("factualTheory")}</dt>
            <dd>{caseTheory.factualTheory}</dd>
          </div>
          <div>
            <dt className="font-medium text-orech-ink">
              {t("persuasiveTheory")}
            </dt>
            <dd>{caseTheory.persuasiveTheory}</dd>
          </div>
        </dl>
      </details>
    </Section>
  );
}

function ExhibitsBlock({ exhibits }: { exhibits: ExhibitEntry[] }) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section
      title={t("evidence")}
      subtitle={
        exhibits.length === 1
          ? t("evidenceExhibit", { count: 1 })
          : t("evidenceExhibits", { count: exhibits.length })
      }
    >
      {exhibits.length === 0 ? (
        <Empty>{t("evidenceEmpty")}</Empty>
      ) : (
        <ul className="space-y-1.5">
          {exhibits.map((e) => (
            <li
              key={e.ref}
              className="rounded-md border border-orech-line bg-orech-paper/80 px-2 py-1.5 text-[0.74rem]"
            >
              <p className="text-orech-ink">
                <span className="mr-1.5 font-mono text-[0.7rem] text-orech-bronze">
                  {e.ref}
                </span>
                <span className="truncate">{e.filename}</span>
              </p>
              <p className="text-[0.68rem] text-orech-mist">
                {e.classification} · {e.oneLiner}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ProceduralBlock({ procedural }: { procedural: ProceduralEntry[] }) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section
      title={t("procedural")}
      subtitle={procedural.length === 0 ? "-" : `${procedural.length}`}
    >
      {procedural.length === 0 ? (
        <Empty>{t("proceduralEmpty")}</Empty>
      ) : (
        <ul className="space-y-1.5">
          {procedural.map((p) => (
            <li
              key={p.id}
              className={`rounded-md border px-2 py-1.5 text-[0.74rem] ${p.isHardStop ? "border-amber-500/40 bg-amber-500/10" : "border-orech-line bg-orech-paper/80"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[0.7rem] text-orech-bronze">
                  {p.dateIso ?? p.dateText}
                </span>
                <span className="text-[0.65rem] uppercase tracking-wider text-orech-mist">
                  {p.kind.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-orech-ink">{p.description}</p>
              {typeof p.daysFromNow === "number" && (
                <p className="mt-1 text-[0.66rem] text-orech-mist">
                  {p.daysFromNow >= 0
                    ? p.daysFromNow === 1
                      ? t("proceduralDaysIn", { count: 1 })
                      : t("proceduralDaysIn_plural", { count: p.daysFromNow })
                    : Math.abs(p.daysFromNow) === 1
                      ? t("proceduralDaysAgo", { count: 1 })
                      : t("proceduralDaysAgo_plural", {
                          count: Math.abs(p.daysFromNow),
                        })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function DamagesBlock({
  damages,
  totalEurMinor,
}: {
  damages: DamageEntry[];
  totalEurMinor: number | null;
}) {
  const t = useTranslations("NeoCaseFile");
  const totalLabel =
    totalEurMinor !== null
      ? `€ ${(totalEurMinor / 100).toLocaleString("en-BE", { maximumFractionDigits: 0 })}`
      : "-";
  return (
    <Section
      title={t("damages")}
      subtitle={
        damages.length === 0 ? "-" : t("damagesTotal", { total: totalLabel })
      }
    >
      {damages.length === 0 ? (
        <Empty>{t("damagesEmpty")}</Empty>
      ) : (
        <ul className="space-y-1.5">
          {damages.map((d) => (
            <li
              key={d.id}
              className="rounded-md border border-orech-line bg-orech-paper/80 px-2 py-1.5 text-[0.74rem]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-orech-bronze">
                  {d.amountText}
                </span>
                <span className="text-[0.62rem] uppercase tracking-wider text-orech-mist">
                  {d.category.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-[0.7rem] text-orech-mist">
                {d.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function OpenQuestionsBlock({ items }: { items: string[] }) {
  const t = useTranslations("NeoCaseFile");
  return (
    <Section title={t("openQuestionsLawyer")} subtitle={`${items.length}`}>
      <ul className="list-disc space-y-1 pl-5 text-[0.74rem] text-orech-mist">
        {items.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Export actions
// ---------------------------------------------------------------------------

function ExportActions({
  status,
  onDownloadPdf,
  onDownloadDocx,
  onSend,
  onDeliver,
  canSend,
  deliveredVia,
}: {
  status:
    | { kind: "idle" }
    | { kind: "working"; label: string }
    | { kind: "ok"; label: string }
    | { kind: "error"; label: string };
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onSend: () => void;
  onDeliver: () => void;
  canSend: boolean;
  deliveredVia: import("./delivery-channel-modal").DeliveryChannel | null;
}) {
  const t = useTranslations("NeoCaseFile");
  const busy = status.kind === "working";
  return (
    <section className="space-y-3 rounded-lg border border-orech-bronze/30 bg-orech-bronze/5 p-3 print:hidden">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-orech-bronze">
        {t("handoff")}
      </p>
      <p className="text-[0.72rem] text-orech-mist">{t("exportDesc")}</p>

      {/* Download row */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <ActionButton onClick={onDownloadPdf} disabled={busy}>
          {busy && status.label.startsWith("Preparing PDF")
            ? t("btnPdfWorking")
            : t("btnPdf")}
        </ActionButton>
        <ActionButton onClick={onDownloadDocx} disabled={busy}>
          {busy && status.label.startsWith("Preparing Word")
            ? t("btnWordWorking")
            : t("btnWord")}
        </ActionButton>
        {canSend ? (
          <ActionButton onClick={onSend} disabled={busy} primary>
            {busy && status.label.startsWith("Sending")
              ? t("btnSendWorking")
              : t("btnSend")}
          </ActionButton>
        ) : null}
      </div>

      {/* Deliver via channel - always visible */}
      <button
        type="button"
        onClick={onDeliver}
        disabled={busy}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-orech-bronze/50 bg-gradient-to-r from-orech-bronze/20 via-orech-bronze/10 to-transparent px-4 py-2.5 text-[0.78rem] font-semibold text-orech-bronze shadow-sm transition-all duration-200 hover:border-orech-bronze hover:from-orech-bronze/30 hover:shadow-orech-bronze/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4 transition group-hover:translate-x-0.5" />
        {deliveredVia
          ? t("btnDeliverAgain")
          : t("btnDeliver")}
      </button>

      {/* Status line */}
      <p
        className={`text-[0.7rem] italic ${
          status.kind === "error"
            ? "text-red-400"
            : status.kind === "ok"
              ? "text-emerald-400"
              : "text-orech-mist/80"
        }`}
        aria-live="polite"
      >
        {status.kind === "idle"
          ? canSend
            ? t("notSentNote")
            : t("disabledNote")
          : status.label}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-orech-mist">
          {title}
        </h3>
        {subtitle ? (
          <span className="text-[0.66rem] text-orech-mist/70">{subtitle}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.74rem] italic text-orech-mist/70">{children}</p>;
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-orech-line bg-orech-paper/80 px-2 py-0.5 text-[0.66rem] text-orech-ink">
      {label}
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "INFO" | "WATCH" | "ATTENTION";
}) {
  const tone =
    severity === "ATTENTION"
      ? "bg-amber-500/20 text-amber-300"
      : severity === "WATCH"
        ? "bg-orech-bronze/20 text-orech-bronze"
        : "bg-orech-slate/40 text-orech-mist";
  return (
    <span
      className={`mr-1.5 rounded px-1 py-0.5 text-[0.6rem] uppercase tracking-wider ${tone}`}
    >
      {severity}
    </span>
  );
}

function RiskLine({ text }: { text: string }) {
  return (
    <li className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-orech-ink">
      {text}
    </li>
  );
}

function SourceBadge({
  ref,
}: {
  ref: { kind: string; ref: string; quote?: string };
}) {
  const label =
    ref.kind === "document"
      ? `📎 ${ref.ref}`
      : ref.kind === "user_message"
        ? `Msg #${ref.ref}`
        : `NEO #${ref.ref}`;
  return (
    <p
      title={ref.quote ?? label}
      className="mt-1 truncate font-mono text-[0.62rem] text-orech-mist/80"
    >
      ↳ {label}
    </p>
  );
}

function CompletenessBar({ score }: { score: number }) {
  const t = useTranslations("NeoCaseFile");
  const clamped = Math.max(0, Math.min(100, score));
  const tone =
    clamped >= 70
      ? "bg-emerald-400"
      : clamped >= 40
        ? "bg-orech-bronze"
        : "bg-orech-mist/50";
  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between text-[0.66rem] text-orech-mist">
        <span>{t("completeness")}</span>
        <span className="font-mono">{clamped}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-orech-slate/60">
        <div
          className={`h-full ${tone} transition-all`}
          style={{ width: `${clamped}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const base =
    "rounded-md px-2.5 py-1 text-[0.7rem] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orech-bronze disabled:cursor-not-allowed disabled:opacity-50";
  const tone = primary
    ? "border border-orech-bronze bg-orech-bronze text-[#121212] hover:bg-[#b78451]"
    : "border border-orech-bronze/50 bg-orech-bronze/10 text-orech-bronze hover:bg-orech-bronze hover:text-[#121212]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  );
}

"use client";

import { useState } from "react";
import { Lock, AlertTriangle, Shield, Scale, Users, TrendingUp, Clock } from "lucide-react";
import { CaseDossier } from "@/lib/neo/intake-summary";

interface ConsentState {
  rep_understanding: boolean;
  info_auth: boolean;
  use_consent: boolean;
}

function RiskBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    MODERATE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    LOW: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    INDETERMINATE: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${colorMap[level] || colorMap.INDETERMINATE}`}>
      <Shield className="h-2.5 w-2.5" />
      {level}
    </span>
  );
}

function UrgencyBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    IMMEDIATE: "bg-red-500/20 text-red-400",
    TIME_SENSITIVE: "bg-amber-500/20 text-amber-400",
    STANDARD: "bg-blue-500/20 text-blue-400",
    NO_URGENCY: "bg-zinc-500/20 text-zinc-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${colorMap[level] || colorMap.STANDARD}`}>
      <Clock className="h-2.5 w-2.5" />
      {level?.replace("_", " ")}
    </span>
  );
}

function SectionLabel({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <p className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-orech-bronze/70 shrink-0" />
      <strong className="text-orech-ink">{label}:</strong>
      {count !== undefined && <span className="text-orech-mist/80">{count} item{count !== 1 ? "s" : ""}</span>}
    </p>
  );
}

export function NeoSubmitReview({
  dossier,
  onSubmit,
  onCancel,
  loading
}: {
  dossier: CaseDossier | null;
  onSubmit: (consents: ConsentState) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [consents, setConsents] = useState<ConsentState>({
    rep_understanding: false,
    info_auth: false,
    use_consent: false,
  });

  const allConsented = consents.rep_understanding && consents.info_auth && consents.use_consent;
  const isBlocked = dossier ? !dossier.dispatch_allowed : false;
  const disableSubmit = !allConsented || loading || isBlocked;

  const d = dossier?.dossier;

  return (
    <div className="w-full max-w-[380px] mx-auto space-y-4 text-left">
      <div className="text-center mb-4">
         <h3 className="text-xl font-display text-orech-ink">Case Intelligence Review</h3>
         <p className="text-xs text-orech-mist mt-1">Professional dossier compiled by NEO Report Architect v8.0</p>
      </div>

      {/* ─── Dossier Intelligence Panel ─── */}
      <div className="border border-orech-line bg-orech-slate rounded-lg p-3 text-xs text-orech-mist/90 space-y-2 max-h-72 overflow-y-auto font-mono">
        {!dossier ? (
           <p className="py-4 text-center animate-pulse">Compiling Partner-Grade Case Intelligence…</p>
        ) : dossier.report_status === "validated" && d ? (
           <>
              {/* Executive Narrative */}
              {d.A_matter_snapshot.executive_narrative && (
                <div className="bg-orech-ink/5 rounded p-2 mb-2 italic text-[11px] leading-relaxed text-orech-mist/80 border-l-2 border-orech-bronze/40">
                  {d.A_matter_snapshot.executive_narrative}
                </div>
              )}

              {/* Matter Snapshot */}
              <p><strong className="text-orech-ink">A. Matter:</strong> {d.A_matter_snapshot.visitor_issue}</p>
              <p><strong className="text-orech-ink">Practice Area:</strong> {d.A_matter_snapshot.practice_area}
                <span className="ml-1.5 text-[9px] opacity-60">({d.A_matter_snapshot.classification_confidence})</span>
              </p>

              <hr className="border-orech-line my-2" />

              {/* Core Extractions */}
              <SectionLabel icon={Scale} label="B. Confirmed Facts" count={d.B_confirmed_facts.length} />
              <SectionLabel icon={AlertTriangle} label="D. Critical Unknowns" count={d.D_missing_critical_facts.length} />
              <p><strong className="text-orech-ink">E. Timeline:</strong> {d.E_timeline_extracted.length} event{d.E_timeline_extracted.length !== 1 ? "s" : ""} mapped</p>
              <p><strong className="text-orech-ink">F. Working Issues:</strong> {d.F_working_issue_map.length} legal question{d.F_working_issue_map.length !== 1 ? "s" : ""}</p>

              {/* Intelligence Sections */}
              {(d.K_liability_exposure || d.M_procedural_posture || d.N_parties_witness_map || d.O_quantum_damages) && (
                <>
                  <hr className="border-orech-line my-2" />
                  <p className="text-[9px] uppercase tracking-wider text-orech-bronze/60 font-bold">Intelligence Layers</p>

                  {d.K_liability_exposure && (
                    <div className="flex items-center justify-between">
                      <SectionLabel icon={Shield} label="K. Liability" />
                      <RiskBadge level={d.K_liability_exposure.risk_level} />
                    </div>
                  )}

                  {d.M_procedural_posture && (
                    <div className="flex items-center justify-between">
                      <span className="text-orech-ink font-bold text-[11px]">M. Procedural Stage</span>
                      {d.M_procedural_posture.urgency_classification && (
                        <UrgencyBadge level={d.M_procedural_posture.urgency_classification} />
                      )}
                    </div>
                  )}

                  {d.L_strategic_alternatives && d.L_strategic_alternatives.length > 0 && (
                    <SectionLabel icon={TrendingUp} label="L. Strategic Paths" count={d.L_strategic_alternatives.length} />
                  )}

                  {d.N_parties_witness_map && d.N_parties_witness_map.length > 0 && (
                    <SectionLabel icon={Users} label="N. Parties Mapped" count={d.N_parties_witness_map.length} />
                  )}

                  {d.O_quantum_damages && (
                    <p className="flex items-center gap-1.5">
                      <Scale className="h-3 w-3 text-orech-bronze/70 shrink-0" />
                      <strong className="text-orech-ink">O. Quantum:</strong>
                      <span className="text-[9px] opacity-70">({d.O_quantum_damages.quantification_confidence})</span>
                    </p>
                  )}
                </>
              )}

              <hr className="border-orech-line my-2" />
              <p><strong className="text-orech-ink">I. Open Questions:</strong> {d.I_high_value_open_questions.length} flag{d.I_high_value_open_questions.length !== 1 ? "s" : ""} for partner</p>
              <p className="text-[10px] text-orech-mist/70">* {d.J_delivery_status} *</p>
           </>
        ) : (
           <div className="py-2 text-center text-red-500/90 h-full flex flex-col justify-center space-y-2">
             <p className="font-bold">Report blocked for safe reclassification and fact cleanup.</p>
             <p className="text-[10px] text-red-500/70">{dossier.blocked_message || "Safety check failed."}</p>
           </div>
        )}
      </div>

      {/* ─── Consent & Dispatch ─── */}
      <div className="space-y-3">
         {isBlocked && (
            <p className="text-[#ff5c5c] text-xs font-semibold pb-1">
              Dispatch is disabled. This matter requires manual review offline.
            </p>
         )}
         {dossier && dossier.report_status !== "partner_review_ready" && dossier.report_status !== "validated" && (
            <div className="rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[0.74rem] text-amber-500">
              <p>Neo flagged missing or unclear elements in this dossier.</p>
            </div>
         )}
         <label className={`flex items-start gap-2 text-[11px] leading-tight cursor-pointer ${isBlocked ? 'text-orech-mist/40 cursor-not-allowed' : 'text-orech-mist'}`}>
            <input type="checkbox" disabled={isBlocked} checked={consents.rep_understanding} onChange={e => setConsents({...consents, rep_understanding: e.target.checked})} className="mt-0.5 rounded border-orech-line bg-orech-slate text-orech-bronze focus:ring-orech-bronze/50 disabled:opacity-50" />
            <span>I understand this submission is for legal review and does not itself create representation.</span>
         </label>
         <label className={`flex items-start gap-2 text-[11px] leading-tight cursor-pointer ${isBlocked ? 'text-orech-mist/40 cursor-not-allowed' : 'text-orech-mist'}`}>
            <input type="checkbox" disabled={isBlocked} checked={consents.info_auth} onChange={e => setConsents({...consents, info_auth: e.target.checked})} className="mt-0.5 rounded border-orech-line bg-orech-slate text-orech-bronze focus:ring-orech-bronze/50 disabled:opacity-50" />
            <span>I confirm the contact information I entered is mine or I am authorized to use it.</span>
         </label>
         <label className={`flex items-start gap-2 text-[11px] leading-tight cursor-pointer ${isBlocked ? 'text-orech-mist/40 cursor-not-allowed' : 'text-orech-mist'}`}>
            <input type="checkbox" disabled={isBlocked} checked={consents.use_consent} onChange={e => setConsents({...consents, use_consent: e.target.checked})} className="mt-0.5 rounded border-orech-line bg-orech-slate text-orech-bronze focus:ring-orech-bronze/50 disabled:opacity-50" />
            <span>I consent to the firm using this information to review and follow up on my intake.</span>
         </label>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <button 
          onClick={() => { if(!disableSubmit) onSubmit(consents); }} 
          disabled={disableSubmit} 
          className="w-full bg-orech-bronze text-[#121212] font-semibold rounded-lg py-3 text-sm hover:opacity-90 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-orech-line disabled:text-orech-mist"
        >
          {loading ? "Committing…" : "Finalize & Dispatch"}
        </button>
        <button onClick={onCancel} disabled={loading} className="text-xs text-orech-mist hover:text-orech-ink transition text-center w-full mt-1">Return to Draft</button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-orech-mist/70">
        <Lock className="h-3 w-3" />
        <span>TLS 1.3 Encrypted • GDPR & EU AI Act Safe</span>
      </div>
    </div>
  );
}

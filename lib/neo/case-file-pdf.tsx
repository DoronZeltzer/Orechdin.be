/**
 * Server-side PDF renderer for a CaseFile.
 *
 * Built on @react-pdf/renderer. Runs on Node (no Chromium, no API key).
 * Layout follows the same OVB Behandeling-dossier section order as
 * `case-file-export.ts` so the lawyer reads PDF and Markdown identically.
 *
 * Editorial defaults: A4, 48pt margins, Times-Roman for display headings,
 * Helvetica for body - both bundled with @react-pdf/renderer so the build
 * has zero font dependency.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type {
  CaseFile,
  ChronologyEntry,
  DamageEntry,
  ExhibitEntry,
  LegalIssue,
  OvbFolder,
  PartyEntry,
  ProceduralEntry,
} from "./case-file-types";

const COLORS = {
  ink: "#1A1A1A",
  mist: "#5A5A5A",
  rule: "#D8D2C7",
  bronze: "#9A6B3F",
  amber: "#B86C2A",
  red: "#A33A2A",
  panel: "#F7F3EC",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.45,
  },
  // ── Cover ──────────────────────────────────────────────────────────────
  coverEyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.bronze,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  coverTitle: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    lineHeight: 1.15,
    color: COLORS.ink,
    marginBottom: 10,
  },
  coverTheme: {
    fontFamily: "Times-Italic",
    fontSize: 12,
    color: COLORS.mist,
    marginBottom: 24,
  },
  coverMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 0.6,
    borderColor: COLORS.rule,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8.5,
    color: COLORS.ink,
  },
  chipBronze: {
    borderWidth: 0.6,
    borderColor: COLORS.bronze,
    backgroundColor: "#F7E9D8",
    color: COLORS.bronze,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  chipAmber: {
    borderWidth: 0.6,
    borderColor: COLORS.amber,
    backgroundColor: "#FBE9D2",
    color: COLORS.amber,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  chipRed: {
    borderWidth: 0.6,
    borderColor: COLORS.red,
    backgroundColor: "#F8DAD3",
    color: COLORS.red,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: COLORS.rule,
  },
  metaLabel: {
    width: 130,
    color: COLORS.mist,
    fontSize: 9,
  },
  metaValue: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 9.5,
  },
  // ── Section ────────────────────────────────────────────────────────────
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontFamily: "Times-Roman",
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: COLORS.bronze,
    paddingBottom: 3,
  },
  sectionSubtitle: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8.5,
    color: COLORS.mist,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 6,
    color: COLORS.ink,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    color: COLORS.bronze,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: COLORS.ink,
  },
  // ── List entries ───────────────────────────────────────────────────────
  entry: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: COLORS.rule,
  },
  entryHard: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: COLORS.amber,
  },
  entryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  entryDate: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.bronze,
  },
  entryTag: {
    fontSize: 8,
    color: COLORS.mist,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  entryBody: {
    fontSize: 9.5,
    color: COLORS.ink,
    marginBottom: 2,
  },
  source: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: COLORS.mist,
  },
  // ── Risk callout ───────────────────────────────────────────────────────
  callout: {
    backgroundColor: COLORS.panel,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.bronze,
    marginBottom: 6,
  },
  calloutAmber: {
    backgroundColor: "#FBE9D2",
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.amber,
    marginBottom: 6,
  },
  // ── OVB folders ────────────────────────────────────────────────────────
  folderTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.ink,
    marginTop: 6,
    marginBottom: 3,
  },
  // ── Transcript ─────────────────────────────────────────────────────────
  turnLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COLORS.bronze,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 2,
  },
  turnText: {
    fontSize: 9.5,
    color: COLORS.ink,
    marginBottom: 2,
  },
  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 7.5,
    color: COLORS.mist,
    textAlign: "center",
    fontFamily: "Helvetica-Oblique",
    borderTopWidth: 0.4,
    borderTopColor: COLORS.rule,
    paddingTop: 6,
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 56,
    fontSize: 7.5,
    color: COLORS.mist,
  },
});

const FOLDER_TITLE: Record<OvbFolder, string> = {
  "01_Intake": "01 - Intake",
  "02_Communicatie": "02 - Communicatie",
  "03_Processtukken": "03 - Processtukken",
  "04_Overige_stukken": "04 - Overige stukken",
};

function urgencyChip(urgency: CaseFile["cover"]["urgency"]) {
  if (urgency === "CRITICAL") return styles.chipRed;
  if (urgency === "HIGH") return styles.chipAmber;
  if (urgency === "MEDIUM") return styles.chipBronze;
  return styles.chip;
}

function fmtEuro(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "-";
  return `€ ${(minor / 100).toLocaleString("en-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function srcLabel(ref: { kind: string; ref: string; quote?: string }): string {
  const base =
    ref.kind === "document"
      ? `Doc: ${ref.ref}`
      : ref.kind === "user_message"
        ? `Msg #${ref.ref}`
        : `NEO #${ref.ref}`;
  return ref.quote ? `${base} - “${ref.quote}”` : base;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Cover({ cf }: { cf: CaseFile }) {
  return (
    <View>
      <Text style={styles.coverEyebrow}>Orechdin · Case file</Text>
      <Text style={styles.coverTitle}>{cf.cover.caption}</Text>
      <Text style={styles.coverTheme}>{cf.cover.theme}</Text>
      <View style={styles.coverMeta}>
        <Text style={styles.chip}>{cf.cover.practiceArea}</Text>
        <Text style={urgencyChip(cf.cover.urgency)}>{cf.cover.urgency}</Text>
        {cf.cover.suggestedLead ? (
          <Text style={styles.chip}>{`Lead: ${cf.cover.suggestedLead}`}</Text>
        ) : null}
        <Text style={styles.chip}>{`Language: ${cf.cover.language}`}</Text>
        <Text style={styles.chip}>{`Status: ${cf.cover.status}`}</Text>
      </View>
      <View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Matter id</Text>
          <Text style={styles.metaValue}>{cf.cover.matterId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Opened</Text>
          <Text style={styles.metaValue}>
            {new Date(cf.cover.openedAt).toISOString().slice(0, 10)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Next deadline</Text>
          <Text style={styles.metaValue}>{cf.cover.nextDeadline ?? "-"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>SOL alert</Text>
          <Text style={styles.metaValue}>
            {cf.cover.statuteOfLimitationsAlert ?? "-"}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Completeness</Text>
          <Text style={styles.metaValue}>{cf.completeness.score}%</Text>
        </View>
      </View>
    </View>
  );
}

function ExecutiveSummary({ cf }: { cf: CaseFile }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Executive summary</Text>
      <Text style={styles.sectionSubtitle}>≤ 300 words · partner reads first</Text>
      <Text style={styles.paragraph}>{cf.executiveSummary.paragraph}</Text>
      {cf.executiveSummary.bullets.map((b, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>·</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function RiskGate({ cf }: { cf: CaseFile }) {
  const r = cf.risk;
  const empty =
    r.conflictFlags.length === 0 &&
    !r.sensitiveMatter &&
    !r.jurisdictionRisk &&
    !r.concurrentCounselMentioned;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Risk &amp; conflict gate</Text>
      <Text style={styles.sectionSubtitle}>
        Surfaced before facts per ABA Rule 1.7 / OVB Codex Deontologie Deel III.
      </Text>
      {empty ? (
        <Text style={styles.paragraph}>
          No automatic risk signal raised. The lawyer&apos;s formal conflict check is still required.
        </Text>
      ) : (
        <View>
          {r.conflictFlags.map((f) => (
            <View key={f.id} style={styles.calloutAmber}>
              <Text
                style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: COLORS.ink }}
              >
                {`[${f.severity}] ${f.label}`}
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.mist, marginTop: 2 }}>{f.reason}</Text>
            </View>
          ))}
          {r.sensitiveMatter && (
            <Text style={styles.calloutAmber}>
              Sensitive subject-matter cue → apply firm&apos;s sensitive-matter protocol.
            </Text>
          )}
          {r.jurisdictionRisk && (
            <Text style={styles.calloutAmber}>
              Possible out-of-jurisdiction matter → confirm Belgian competence.
            </Text>
          )}
          {r.concurrentCounselMentioned && (
            <Text style={styles.calloutAmber}>
              Visitor mentioned existing counsel → verify no double representation.
            </Text>
          )}
        </View>
      )}
      <Text style={[styles.sectionSubtitle, { marginTop: 4 }]}>Pre-engagement checks</Text>
      {r.preEngagementChecks.map((c, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>·</Text>
          <Text style={styles.bulletText}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

function Parties({ parties }: { parties: PartyEntry[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Parties</Text>
      <Text style={styles.sectionSubtitle}>{`${parties.length} mentioned`}</Text>
      {parties.length === 0 ? (
        <Text style={styles.paragraph}>Nobody named yet.</Text>
      ) : (
        parties.map((p) => (
          <View key={p.id} style={styles.entry} wrap={false}>
            <View style={styles.entryHead}>
              <Text style={styles.entryDate}>{p.name}</Text>
              <Text style={styles.entryTag}>{p.role.replace(/_/g, " ")}</Text>
            </View>
            {p.relationship ? (
              <Text style={styles.entryBody}>{p.relationship}</Text>
            ) : null}
            <Text style={styles.source}>↳ {srcLabel(p.source)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Chronology({ chronology }: { chronology: ChronologyEntry[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chronology</Text>
      <Text style={styles.sectionSubtitle}>
        {chronology.length === 0 ? "-" : `${chronology.length} event(s)`}
      </Text>
      {chronology.length === 0 ? (
        <Text style={styles.paragraph}>No dated events extracted.</Text>
      ) : (
        chronology.map((c) => (
          <View key={c.id} style={styles.entry} wrap={false}>
            <View style={styles.entryHead}>
              <Text style={styles.entryDate}>{c.dateIso ?? c.dateText}</Text>
              {c.dateIso && c.dateIso !== c.dateText ? (
                <Text style={styles.entryTag}>{`“${c.dateText}”`}</Text>
              ) : null}
            </View>
            <Text style={styles.entryBody}>{c.event}</Text>
            <Text style={styles.source}>↳ {srcLabel(c.source)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Issues({ issues, theory }: { issues: LegalIssue[]; theory: CaseFile["caseTheory"] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal issues &amp; theory</Text>
      <Text style={styles.sectionSubtitle}>
        Working hypothesis only - final classification by the lawyer.
      </Text>
      {issues.map((iss, i) => (
        <View key={iss.id} style={styles.entry} wrap={false}>
          <View style={styles.entryHead}>
            <Text style={styles.entryDate}>{`#${i + 1} · ${iss.area}`}</Text>
            <Text style={styles.entryTag}>{`strength: ${iss.strength.toLowerCase()}`}</Text>
          </View>
          <Text style={styles.entryBody}>{iss.question}</Text>
          {iss.openQuestions.length > 0 && (
            <View style={{ marginTop: 2 }}>
              {iss.openQuestions.map((q, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletDot}>·</Text>
                  <Text style={styles.bulletText}>{q}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      <View style={styles.callout}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, marginBottom: 2 }}>
          Case theory (NITA framework)
        </Text>
        <Text style={styles.entryBody}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Legal. </Text>
          {theory.legalTheory}
        </Text>
        <Text style={styles.entryBody}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Factual. </Text>
          {theory.factualTheory}
        </Text>
        <Text style={styles.entryBody}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Persuasive. </Text>
          {theory.persuasiveTheory}
        </Text>
      </View>
    </View>
  );
}

function Exhibits({ exhibits }: { exhibits: ExhibitEntry[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Evidence index</Text>
      <Text style={styles.sectionSubtitle}>
        {exhibits.length === 0 ? "no exhibits" : `${exhibits.length} exhibit(s)`}
      </Text>
      {exhibits.length === 0 ? (
        <Text style={styles.paragraph}>
          The visitor did not attach any documents - the brief is built from the conversation alone.
        </Text>
      ) : (
        exhibits.map((e) => (
          <View key={e.ref} style={styles.entry} wrap={false}>
            <View style={styles.entryHead}>
              <Text style={styles.entryDate}>{`${e.ref} · ${e.filename}`}</Text>
              <Text style={styles.entryTag}>{e.classification}</Text>
            </View>
            <Text style={styles.entryBody}>{e.oneLiner}</Text>
            <Text style={styles.source}>↳ {srcLabel(e.introducedBy)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Procedural({ procedural }: { procedural: ProceduralEntry[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Procedural posture</Text>
      <Text style={styles.sectionSubtitle}>
        {procedural.length === 0 ? "-" : `${procedural.length} item(s)`}
      </Text>
      {procedural.length === 0 ? (
        <Text style={styles.paragraph}>No deadlines or hearings extracted.</Text>
      ) : (
        procedural.map((p) => (
          <View key={p.id} style={p.isHardStop ? styles.entryHard : styles.entry} wrap={false}>
            <View style={styles.entryHead}>
              <Text style={styles.entryDate}>{p.dateIso ?? p.dateText}</Text>
              <Text style={styles.entryTag}>{p.kind.replace(/_/g, " ")}</Text>
            </View>
            <Text style={styles.entryBody}>{p.description}</Text>
            {typeof p.daysFromNow === "number" ? (
              <Text style={styles.source}>
                {p.daysFromNow >= 0
                  ? `in ${p.daysFromNow} day(s)`
                  : `${Math.abs(p.daysFromNow)} day(s) ago`}
              </Text>
            ) : null}
            <Text style={styles.source}>↳ {srcLabel(p.source)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Damages({ damages }: { damages: CaseFile["damages"] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Damages / quantum</Text>
      <Text style={styles.sectionSubtitle}>{`Total ≈ ${fmtEuro(damages.totalEurMinor)}`}</Text>
      {damages.entries.length === 0 ? (
        <Text style={styles.paragraph}>No monetary stakes mentioned yet.</Text>
      ) : (
        damages.entries.map((d: DamageEntry) => (
          <View key={d.id} style={styles.entry} wrap={false}>
            <View style={styles.entryHead}>
              <Text style={styles.entryDate}>{d.amountText}</Text>
              <Text style={styles.entryTag}>{d.category.replace(/_/g, " ")}</Text>
            </View>
            <Text style={styles.entryBody}>{d.description}</Text>
            <Text style={styles.source}>↳ {srcLabel(d.source)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function OvbAllocation({ cf }: { cf: CaseFile }) {
  const byFolder: Record<OvbFolder, { label: string; rationale: string }[]> = {
    "01_Intake": [],
    "02_Communicatie": [],
    "03_Processtukken": [],
    "04_Overige_stukken": [],
  };
  for (const a of cf.ovbAllocation) {
    byFolder[a.folder].push({ label: a.label, rationale: a.rationale });
  }
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>OVB folder allocation</Text>
      <Text style={styles.sectionSubtitle}>
        Per Orde van Vlaamse Balies - Behandeling dossier.
      </Text>
      {(Object.keys(byFolder) as OvbFolder[]).map((folder) => {
        const items = byFolder[folder];
        if (items.length === 0) return null;
        return (
          <View key={folder} style={{ marginBottom: 4 }}>
            <Text style={styles.folderTitle}>{FOLDER_TITLE[folder]}</Text>
            {items.map((it, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletText}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{it.label}</Text>
                  {` - ${it.rationale}`}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function OpenQuestions({ items }: { items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Open questions for the lawyer</Text>
      {items.map((q, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>·</Text>
          <Text style={styles.bulletText}>{q}</Text>
        </View>
      ))}
    </View>
  );
}

function Transcript({ cf }: { cf: CaseFile }) {
  return (
    <View style={styles.section} break>
      <Text style={styles.sectionTitle}>Conversation transcript (verbatim)</Text>
      <Text style={styles.sectionSubtitle}>
        Reference target for every source pointer above.
      </Text>
      {cf.transcript.map((t, i) => (
        <View key={i} wrap={false} style={{ marginBottom: 4 }}>
          <Text style={styles.turnLabel}>
            {`[${i + 1}] ${t.role === "user" ? "VISITOR" : "NEO"}${
              t.via === "voice" ? " · DICTATED" : ""
            } · ${t.ts}`}
          </Text>
          <Text style={styles.turnText}>{t.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

function CaseFileDocument({ cf, disclaimer }: { cf: CaseFile; disclaimer: string }) {
  return (
    <Document
      title={`Case File - ${cf.cover.caption}`}
      author="NEO · Orechdin"
      subject={cf.cover.practiceArea}
      creator="orechdin.be"
      producer="orechdin.be"
    >
      <Page size="A4" style={styles.page} wrap>
        <Cover cf={cf} />
        <ExecutiveSummary cf={cf} />
        <RiskGate cf={cf} />
        <Parties parties={cf.parties} />
        <Chronology chronology={cf.chronology} />
        <Issues issues={cf.issues} theory={cf.caseTheory} />
        <Exhibits exhibits={cf.exhibits} />
        <Procedural procedural={cf.procedural} />
        <Damages damages={cf.damages} />
        <OpenQuestions items={cf.openQuestionsForLawyer} />
        <OvbAllocation cf={cf} />
        <Transcript cf={cf} />
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${disclaimer} · Assembled by NEO from the visitor's own messages - every fact carries a source pointer (Msg # / Doc:) so the lawyer can verify in seconds. · Page ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Public render API
// ---------------------------------------------------------------------------

export async function renderCaseFilePdf(
  cf: CaseFile,
  options: { disclaimer: string },
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <CaseFileDocument cf={cf} disclaimer={options.disclaimer} />,
  );
  return new Uint8Array(buffer);
}

/**
 * Server-side .docx renderer for a CaseFile.
 *
 * Built on the `docx` npm package — generates a native Microsoft Word
 * document the lawyer can open, edit, and track-change. Same 12-section
 * order as the PDF and Markdown so all three artefacts read identically.
 *
 * No external service, no font registration required: docx ships its own
 * runtime and Word substitutes Calibri/Cambria locally.
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
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

const COLOR_INK = "1A1A1A";
const COLOR_MIST = "5A5A5A";
const COLOR_BRONZE = "9A6B3F";
const COLOR_AMBER = "B86C2A";

const FOLDER_TITLE: Record<OvbFolder, string> = {
  "01_Intake": "01 — Intake",
  "02_Communicatie": "02 — Communicatie",
  "03_Processtukken": "03 — Processtukken",
  "04_Overige_stukken": "04 — Overige stukken",
};

function fmtEuro(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "—";
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
  return ref.quote ? `${base} — “${ref.quote}”` : base;
}

// ---------------------------------------------------------------------------
// Paragraph helpers
// ---------------------------------------------------------------------------

function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    children: [
      new TextRun({
        text,
        font: "Cambria",
        size: 32,
        color: COLOR_INK,
      }),
    ],
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { color: COLOR_BRONZE, space: 4, style: "single", size: 6 },
    },
    children: [
      new TextRun({
        text,
        font: "Cambria",
        size: 26,
        color: COLOR_INK,
      }),
    ],
  });
}

function caption(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 18,
        italics: true,
        color: COLOR_MIST,
      }),
    ],
  });
}

function body(text: string, opts?: { bold?: boolean; italics?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 20,
        color: COLOR_INK,
        bold: opts?.bold,
        italics: opts?.italics,
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360, hanging: 220 },
    children: [
      new TextRun({ text: "·  ", font: "Calibri", size: 20, color: COLOR_BRONZE, bold: true }),
      new TextRun({ text, font: "Calibri", size: 20, color: COLOR_INK }),
    ],
  });
}

function entryHead(left: string, right: string, hardStop = false): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 40 },
    tabStops: [{ type: "right", position: 9000 }],
    children: [
      new TextRun({
        text: left,
        font: "Calibri",
        size: 20,
        bold: true,
        color: hardStop ? COLOR_AMBER : COLOR_BRONZE,
      }),
      new TextRun({
        text: `\t${right}`,
        font: "Calibri",
        size: 16,
        color: COLOR_MIST,
        characterSpacing: 20,
        allCaps: true,
      }),
    ],
  });
}

function source(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: `↳ ${text}`,
        font: "Calibri",
        size: 16,
        italics: true,
        color: COLOR_MIST,
      }),
    ],
  });
}

function callout(lines: { text: string; bold?: boolean }[], tone: "bronze" | "amber" = "bronze"): Paragraph[] {
  const fill = tone === "amber" ? "FBE9D2" : "F7F3EC";
  return lines.map(
    (l, i) =>
      new Paragraph({
        spacing: { after: i === lines.length - 1 ? 120 : 20 },
        shading: { type: ShadingType.CLEAR, color: "auto", fill },
        border: {
          left: {
            color: tone === "amber" ? COLOR_AMBER : COLOR_BRONZE,
            space: 6,
            style: "single",
            size: 12,
          },
        },
        children: [
          new TextRun({
            text: l.text,
            font: "Calibri",
            size: 20,
            color: COLOR_INK,
            bold: l.bold,
          }),
        ],
      }),
  );
}

function metaTable(rows: { label: string; value: string }[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: r.label, font: "Calibri", size: 18, color: COLOR_MIST }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: r.value, font: "Calibri", size: 19, color: COLOR_INK }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function coverSection(cf: CaseFile): (Paragraph | Table)[] {
  return [
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "ORECHDIN · CASE FILE",
          font: "Calibri",
          size: 16,
          bold: true,
          color: COLOR_BRONZE,
          characterSpacing: 60,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: cf.cover.caption,
          font: "Cambria",
          size: 44,
          color: COLOR_INK,
        }),
      ],
    }),
    caption(cf.cover.theme),
    metaTable([
      { label: "Practice area", value: cf.cover.practiceArea },
      { label: "Urgency", value: cf.cover.urgency },
      { label: "Suggested lead", value: cf.cover.suggestedLead ?? "—" },
      { label: "Language", value: cf.cover.language },
      { label: "Status", value: cf.cover.status },
      { label: "Matter id", value: cf.cover.matterId },
      { label: "Opened", value: new Date(cf.cover.openedAt).toISOString().slice(0, 10) },
      { label: "Next deadline", value: cf.cover.nextDeadline ?? "—" },
      { label: "SOL alert", value: cf.cover.statuteOfLimitationsAlert ?? "—" },
      { label: "Completeness", value: `${cf.completeness.score}%` },
    ]),
  ];
}

function execSection(cf: CaseFile): Paragraph[] {
  return [
    h2("Executive summary"),
    caption("≤ 300 words · partner reads first"),
    body(cf.executiveSummary.paragraph),
    ...cf.executiveSummary.bullets.map((b) => bullet(b)),
  ];
}

function riskSection(cf: CaseFile): Paragraph[] {
  const r = cf.risk;
  const out: Paragraph[] = [
    h2("Risk & conflict gate"),
    caption("Surfaced before facts per ABA Rule 1.7 / OVB Codex Deontologie Deel III."),
  ];
  const empty =
    r.conflictFlags.length === 0 &&
    !r.sensitiveMatter &&
    !r.jurisdictionRisk &&
    !r.concurrentCounselMentioned;
  if (empty) {
    out.push(
      body(
        "No automatic risk signal raised. The lawyer's formal conflict check is still required.",
      ),
    );
  } else {
    for (const f of r.conflictFlags) {
      out.push(
        ...callout(
          [
            { text: `[${f.severity}] ${f.label}`, bold: true },
            { text: f.reason },
          ],
          "amber",
        ),
      );
    }
    if (r.sensitiveMatter)
      out.push(
        ...callout(
          [{ text: "Sensitive subject-matter cue → apply firm's sensitive-matter protocol." }],
          "amber",
        ),
      );
    if (r.jurisdictionRisk)
      out.push(
        ...callout(
          [{ text: "Possible out-of-jurisdiction matter → confirm Belgian competence." }],
          "amber",
        ),
      );
    if (r.concurrentCounselMentioned)
      out.push(
        ...callout(
          [{ text: "Visitor mentioned existing counsel → verify no double representation." }],
          "amber",
        ),
      );
  }
  out.push(body("Pre-engagement checks", { bold: true }));
  for (const c of r.preEngagementChecks) out.push(bullet(c));
  return out;
}

function partiesSection(parties: PartyEntry[]): Paragraph[] {
  const out: Paragraph[] = [h2("Parties"), caption(`${parties.length} mentioned`)];
  if (parties.length === 0) {
    out.push(body("Nobody named yet."));
    return out;
  }
  for (const p of parties) {
    out.push(entryHead(p.name, p.role.replace(/_/g, " ")));
    if (p.relationship) out.push(body(p.relationship));
    out.push(source(srcLabel(p.source)));
  }
  return out;
}

function chronologySection(chronology: ChronologyEntry[]): Paragraph[] {
  const out: Paragraph[] = [
    h2("Chronology"),
    caption(chronology.length === 0 ? "—" : `${chronology.length} event(s)`),
  ];
  if (chronology.length === 0) {
    out.push(body("No dated events extracted."));
    return out;
  }
  for (const c of chronology) {
    out.push(
      entryHead(
        c.dateIso ?? c.dateText,
        c.dateIso && c.dateIso !== c.dateText ? `“${c.dateText}”` : "",
      ),
    );
    out.push(body(c.event));
    out.push(source(srcLabel(c.source)));
  }
  return out;
}

function issuesSection(issues: LegalIssue[], theory: CaseFile["caseTheory"]): Paragraph[] {
  const out: Paragraph[] = [
    h2("Legal issues & theory"),
    caption("Working hypothesis only — final classification by the lawyer."),
  ];
  issues.forEach((iss, i) => {
    out.push(entryHead(`#${i + 1} · ${iss.area}`, `strength: ${iss.strength.toLowerCase()}`));
    out.push(body(iss.question));
    for (const q of iss.openQuestions) out.push(bullet(q));
  });
  out.push(
    ...callout([
      { text: "Case theory (NITA framework)", bold: true },
      { text: `Legal. ${theory.legalTheory}` },
      { text: `Factual. ${theory.factualTheory}` },
      { text: `Persuasive. ${theory.persuasiveTheory}` },
    ]),
  );
  return out;
}

function exhibitsSection(exhibits: ExhibitEntry[]): Paragraph[] {
  const out: Paragraph[] = [
    h2("Evidence index"),
    caption(exhibits.length === 0 ? "no exhibits" : `${exhibits.length} exhibit(s)`),
  ];
  if (exhibits.length === 0) {
    out.push(
      body(
        "The visitor did not attach any documents — the brief is built from the conversation alone.",
      ),
    );
    return out;
  }
  for (const e of exhibits) {
    out.push(entryHead(`${e.ref} · ${e.filename}`, e.classification));
    out.push(body(e.oneLiner));
    out.push(source(srcLabel(e.introducedBy)));
  }
  return out;
}

function proceduralSection(procedural: ProceduralEntry[]): Paragraph[] {
  const out: Paragraph[] = [
    h2("Procedural posture"),
    caption(procedural.length === 0 ? "—" : `${procedural.length} item(s)`),
  ];
  if (procedural.length === 0) {
    out.push(body("No deadlines or hearings extracted."));
    return out;
  }
  for (const p of procedural) {
    out.push(entryHead(p.dateIso ?? p.dateText, p.kind.replace(/_/g, " "), p.isHardStop));
    out.push(body(p.description));
    if (typeof p.daysFromNow === "number") {
      out.push(
        source(
          p.daysFromNow >= 0
            ? `in ${p.daysFromNow} day(s)`
            : `${Math.abs(p.daysFromNow)} day(s) ago`,
        ),
      );
    }
    out.push(source(srcLabel(p.source)));
  }
  return out;
}

function damagesSection(damages: CaseFile["damages"]): Paragraph[] {
  const out: Paragraph[] = [
    h2("Damages / quantum"),
    caption(`Total ≈ ${fmtEuro(damages.totalEurMinor)}`),
  ];
  if (damages.entries.length === 0) {
    out.push(body("No monetary stakes mentioned yet."));
    return out;
  }
  for (const d of damages.entries as DamageEntry[]) {
    out.push(entryHead(d.amountText, d.category.replace(/_/g, " ")));
    out.push(body(d.description));
    out.push(source(srcLabel(d.source)));
  }
  return out;
}

function openQuestionsSection(items: string[]): Paragraph[] {
  return [h2("Open questions for the lawyer"), ...items.map((q) => bullet(q))];
}

function ovbSection(cf: CaseFile): Paragraph[] {
  const byFolder: Record<OvbFolder, { label: string; rationale: string }[]> = {
    "01_Intake": [],
    "02_Communicatie": [],
    "03_Processtukken": [],
    "04_Overige_stukken": [],
  };
  for (const a of cf.ovbAllocation) {
    byFolder[a.folder].push({ label: a.label, rationale: a.rationale });
  }
  const out: Paragraph[] = [
    h2("OVB folder allocation"),
    caption("Per Orde van Vlaamse Balies — Behandeling dossier."),
  ];
  for (const folder of Object.keys(byFolder) as OvbFolder[]) {
    const items = byFolder[folder];
    if (items.length === 0) continue;
    out.push(body(FOLDER_TITLE[folder], { bold: true }));
    for (const it of items) out.push(bullet(`${it.label} — ${it.rationale}`));
  }
  return out;
}

function transcriptSection(cf: CaseFile): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: "" })], pageBreakBefore: true }),
    h1("Conversation transcript (verbatim)"),
    caption("Reference target for every source pointer above."),
  ];
  cf.transcript.forEach((t, i) => {
    out.push(
      new Paragraph({
        spacing: { before: 100, after: 20 },
        children: [
          new TextRun({
            text: `[${i + 1}] ${t.role === "user" ? "VISITOR" : "NEO"}${
              t.via === "voice" ? " · DICTATED" : ""
            } · ${t.ts}`,
            font: "Calibri",
            size: 16,
            bold: true,
            color: COLOR_BRONZE,
            characterSpacing: 30,
          }),
        ],
      }),
    );
    out.push(body(t.text));
  });
  return out;
}

// ---------------------------------------------------------------------------
// Public render API
// ---------------------------------------------------------------------------

export async function renderCaseFileDocx(
  cf: CaseFile,
  options: { disclaimer: string },
): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [
    ...coverSection(cf),
    ...execSection(cf),
    ...riskSection(cf),
    ...partiesSection(cf.parties),
    ...chronologySection(cf.chronology),
    ...issuesSection(cf.issues, cf.caseTheory),
    ...exhibitsSection(cf.exhibits),
    ...proceduralSection(cf.procedural),
    ...damagesSection(cf.damages),
    ...openQuestionsSection(cf.openQuestionsForLawyer),
    ...ovbSection(cf),
    ...transcriptSection(cf),
    new Paragraph({
      spacing: { before: 240 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${options.disclaimer} · Assembled by NEO from the visitor's own messages.`,
          font: "Calibri",
          size: 14,
          italics: true,
          color: COLOR_MIST,
        }),
      ],
    }),
  ];

  const doc = new Document({
    creator: "orechdin.be",
    title: `Case File — ${cf.cover.caption}`,
    description: cf.cover.practiceArea,
    numbering: {
      config: [
        {
          reference: "bullet",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "·",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: COLOR_INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1100,
              bottom: 1000,
              left: 1100,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

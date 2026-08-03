/**
 * Server route for generating and (optionally) sending a CaseFile.
 *
 * POST /api/neo/case-file
 *   body: {
 *     format: "pdf" | "docx",
 *     send?: boolean,             // also attempt sendBrief()
 *     visitorEmail?: string,
 *     language?: string,
 *     messages: IntakeMessage[],
 *     files?: { original_filename: string; mime_type?: string; storage_status?: string }[],
 *   }
 *
 * Response:
 *   - When `send` is false (default): binary PDF or DOCX with
 *     `Content-Disposition: attachment`.
 *   - When `send` is true: JSON `{ ok, reference, mode, downloadName }` and
 *     the binary is left to the caller to fetch in a follow-up request.
 *
 * No external API keys, no LLM calls — case file is built deterministically
 * from the transcript + filenames in `lib/neo/case-file-builder.ts`.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildCaseFile } from "@/lib/neo/case-file-builder";
import { caseFileFilename } from "@/lib/neo/case-file-export";
import { renderCaseFilePdf } from "@/lib/neo/case-file-pdf";
import { renderCaseFileDocx } from "@/lib/neo/case-file-docx";
import { sendBrief } from "@/lib/neo/send-brief";
import { SITE } from "@/lib/site";
import type { IntakeMessage } from "@/lib/neo/intake-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IncomingFile {
  original_filename: string;
  mime_type?: string;
  storage_status?: string;
}

interface IncomingBody {
  format?: "pdf" | "docx";
  send?: boolean;
  visitorEmail?: string;
  language?: string;
  messages?: IntakeMessage[];
  files?: IncomingFile[];
}

export async function POST(req: NextRequest) {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const format = body.format ?? "pdf";
  if (format !== "pdf" && format !== "docx") {
    return NextResponse.json({ error: "format must be 'pdf' or 'docx'." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "No conversation to render — `messages` is required." },
      { status: 400 },
    );
  }

  const files = (body.files ?? []).map((f) => ({
    original_filename: f.original_filename,
    mime_type: f.mime_type ?? "application/octet-stream",
    storage_status: f.storage_status ?? "PENDING",
  }));

  const caseFile = buildCaseFile({
    matterId: `live-${Date.now().toString(36)}`,
    language: body.language ?? "English",
    messages,
    files,
  });

  if (body.send) {
    const [pdf, docx] = await Promise.all([
      renderCaseFilePdf(caseFile, { disclaimer: SITE.disclaimer }),
      renderCaseFileDocx(caseFile, { disclaimer: SITE.disclaimer }),
    ]);

    try {
      const result = await sendBrief({
        caseFile,
        pdf,
        docx,
        visitorEmail: body.visitorEmail,
      });
      return NextResponse.json({
        ...result,
        downloadName: {
          pdf: caseFileFilename(caseFile, "pdf"),
          docx: caseFileFilename(caseFile, "docx"),
        },
      });
    } catch (e: unknown) {
      const name = e instanceof Error ? e.name : "UnknownError";
      const message = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json({ ok: false, error: name, message }, { status: 503 });
    }
  }

  if (format === "pdf") {
    const bytes = await renderCaseFilePdf(caseFile, { disclaimer: SITE.disclaimer });
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${caseFileFilename(caseFile, "pdf")}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const bytes = await renderCaseFileDocx(caseFile, { disclaimer: SITE.disclaimer });
  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${caseFileFilename(caseFile, "docx")}"`,
      "Cache-Control": "no-store",
    },
  });
}

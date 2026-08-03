import { NextResponse } from "next/server";
import { unifiedFreeAiGenerate } from "@/lib/free-ai-nokey/cascade";
import { toPublicCascadeResponse } from "@/lib/free-ai-nokey/user-api";

/**
 * Legacy infer endpoint — delegates to M05 unified cascade (/v1/freeai/nokey/chat).
 * Never fabricates assistant text on failure (T0D_12).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";

    const result = await unifiedFreeAiGenerate({
      prompt,
      task: "chat",
      execution_plane: "server",
      model: typeof body.model === "string" ? body.model : null,
    });

    const publicResult = toPublicCascadeResponse(result);

    if (publicResult.state === "answer" || publicResult.state === "cached_answer") {
      return NextResponse.json({
        text: publicResult.text,
        state: publicResult.state,
        bucket: publicResult.bucket,
        provider_id: result.receipts.find((r) => r.status === "success")?.provider_id ?? "pollinations_text",
        model_id: result.receipts.find((r) => r.status === "success")?.model_id ?? null,
        request_id: publicResult.request_id,
      });
    }

    return NextResponse.json(
      {
        state: publicResult.state,
        text: null,
        bucket: publicResult.bucket,
        setup_suggestions: publicResult.setup_suggestions,
        request_id: publicResult.request_id,
      },
      { status: publicResult.state === "error" ? 500 : 503 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ state: "error", text: null, error: message }, { status: 500 });
  }
}

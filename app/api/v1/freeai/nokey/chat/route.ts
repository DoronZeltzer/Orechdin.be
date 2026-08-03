import { NextResponse } from "next/server";
import { unifiedFreeAiGenerate } from "@/lib/free-ai-nokey/cascade";
import { toPublicCascadeResponse } from "@/lib/free-ai-nokey/user-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const task = body.task === "image" || body.task === "local_task" ? body.task : "chat";
    const router_mode = body.router_mode ?? null;
    const use_local =
      typeof body.use_local === "boolean" ? body.use_local : null;
    const model = typeof body.model === "string" ? body.model : null;

    const result = await unifiedFreeAiGenerate({
      prompt,
      task,
      router_mode,
      execution_plane: "server",
      use_local,
      model,
      rag_context: body.rag_context ?? null,
    });

    return NextResponse.json(toPublicCascadeResponse(result));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { state: "error", text: null, bucket: null, error: message },
      { status: 500 },
    );
  }
}

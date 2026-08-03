import { NextResponse } from "next/server";
import { unifiedFreeAiGenerate } from "@/lib/free-ai-nokey/cascade";
import { toPublicCascadeResponse } from "@/lib/free-ai-nokey/user-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";

    const result = await unifiedFreeAiGenerate({
      prompt,
      task: "image",
      router_mode: "image",
      execution_plane: "server",
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

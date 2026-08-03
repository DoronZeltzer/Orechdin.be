import { NextResponse } from "next/server";
import { getStatusSnapshot } from "@/lib/free-ai-nokey/cascade";

export async function GET() {
  const snapshot = await getStatusSnapshot();
  return NextResponse.json({
    state: "answer",
    text: null,
    bucket: snapshot.ollama_ready ? "local" : "cloud",
    status: snapshot,
  });
}

export async function POST(req: Request) {
  void req;
  return GET();
}

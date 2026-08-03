import { NextResponse } from "next/server";
import { getStatusSnapshot, probeOllama } from "@/lib/free-ai-nokey";

export async function GET() {
  const snapshot = await getStatusSnapshot();
  const ollama = await probeOllama();

  const suggestions: string[] = [];
  if (!ollama.ready) {
    suggestions.push("Install Ollama from https://ollama.com and run: ollama pull llama3.2");
  }
  suggestions.push("No developer API keys are required in the 0D plane.");
  suggestions.push("Browser providers (Puter.js, WebLLM, Chrome AI) require client-side execution.");

  return NextResponse.json({
    state: ollama.ready ? "answer" : "setup_required",
    setup_suggestions: suggestions,
    ollama_ready: ollama.ready,
    ollama_models: ollama.models,
    router_modes: snapshot.router_modes,
    gradio_enabled: snapshot.gradio_enabled,
    ai_horde_enabled: snapshot.ai_horde_enabled,
  });
}

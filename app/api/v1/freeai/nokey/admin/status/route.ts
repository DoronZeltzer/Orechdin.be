import { NextResponse } from "next/server";
import { getStatusSnapshot } from "@/lib/free-ai-nokey/cascade";

function isAuthorized(req: Request): boolean {
  const token = process.env.FREEAI_NOKEY_ADMIN_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshot = await getStatusSnapshot();
  return NextResponse.json({
    admin: true,
    snapshot,
    provider_registry: Object.keys(
      (await import("@/lib/free-ai-nokey/providers")).PROVIDER_REGISTRY,
    ),
  });
}

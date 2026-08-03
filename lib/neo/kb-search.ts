import type { KbEntry } from "./types";
import kb from "@/data/neo-kb.json";

const entries: KbEntry[] = kb;

function scoreEntry(query: string, e: KbEntry): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let s = 0;
  const hay = `${e.title} ${e.body} ${e.tags.join(" ")}`.toLowerCase();
  if (e.title.toLowerCase().includes(q)) s += 6;
  if (e.tags.some((t) => t.includes(q) || q.includes(t))) s += 4;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  for (const w of words) {
    if (hay.includes(w)) s += 2;
  }
  if (e.body.toLowerCase().includes(q)) s += 3;
  return s;
}

export function searchKb(query: string, limit = 5): KbEntry[] {
  if (!query.trim()) return [];
  const ranked = entries
    .map((e) => ({ e, s: scoreEntry(query, e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.e);
  return ranked;
}

export function allKbEntries(): KbEntry[] {
  return [...entries];
}

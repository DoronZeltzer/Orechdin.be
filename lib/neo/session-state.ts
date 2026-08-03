/**
 * NEO Session State — with browser-side persistence.
 *
 * Design:
 * - `createInitialSessionState()` checks `sessionStorage` for a prior state.
 * - `mergeSessionState()` persists every merge to `sessionStorage`.
 * - State expires with the tab (sessionStorage) — no cross-tab leakage.
 * - Server-side (SSR) calls get pure in-memory state with no storage calls.
 */

const STORAGE_KEY = "neo_session_state";

export interface SessionState {
  jurisdiction_status: "confirmed" | "inferred" | "unclear";
  jurisdiction_value: string | null;
  primary_legal_issue: string | null;
  missing_critical_facts: string[];
  evidentiary_gaps: string[];
  prior_decisions_present: boolean;
  user_goal: string | null;
  current_task_class: string;
}

function isClient(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function loadPersistedState(): SessionState | null {
  if (!isClient()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic shape check — reject garbage
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "jurisdiction_status" in parsed &&
      "current_task_class" in parsed
    ) {
      return parsed as SessionState;
    }
    return null;
  } catch {
    return null;
  }
}

function persistState(state: SessionState): void {
  if (!isClient()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — degrade silently.
  }
}

const DEFAULT_STATE: SessionState = {
  jurisdiction_status: "unclear",
  jurisdiction_value: null,
  primary_legal_issue: null,
  missing_critical_facts: [],
  evidentiary_gaps: [],
  prior_decisions_present: false,
  user_goal: null,
  current_task_class: "lightweight_chat",
};

export function createInitialSessionState(): SessionState {
  return loadPersistedState() ?? { ...DEFAULT_STATE };
}

export function mergeSessionState(
  oldState: SessionState | undefined,
  updates: Partial<SessionState>,
): SessionState {
  const base = oldState || createInitialSessionState();

  // Set-based deduplication for array fields
  const mergedMissing = new Set([
    ...(base.missing_critical_facts || []),
    ...(updates.missing_critical_facts || []),
  ]);
  const mergedGaps = new Set([
    ...(base.evidentiary_gaps || []),
    ...(updates.evidentiary_gaps || []),
  ]);

  const merged: SessionState = {
    ...base,
    ...updates,
    missing_critical_facts: Array.from(mergedMissing),
    evidentiary_gaps: Array.from(mergedGaps),
  };

  persistState(merged);
  return merged;
}

/** Explicitly clear persisted session (e.g., on user logout or reset). */
export function clearSessionState(): void {
  if (!isClient()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

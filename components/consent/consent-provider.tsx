"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ALLOW_ALL,
  DENY_ALL,
  readConsent,
  writeConsent,
  clearConsent,
  type ConsentChoices,
  type ConsentRecord,
  type OptionalCategory,
} from "@/lib/consent";

type ConsentContextValue = {
  /**
   * `false` until the cookie has been read in the browser. Every consumer
   * must render the refused state while this is false — assuming consent for
   * one paint is still loading a tracker without consent.
   */
  ready: boolean;
  /** `null` means undecided, which is treated exactly like "refused". */
  record: ConsentRecord | null;
  /** Convenience read used by gates: never true before `ready`. */
  allows: (category: OptionalCategory) => boolean;
  /** True when the banner should be on screen. */
  bannerOpen: boolean;
  prefsOpen: boolean;
  openPrefs: () => void;
  closePrefs: () => void;
  acceptAll: () => void;
  refuseAll: () => void;
  save: (choices: ConsentChoices) => void;
  withdraw: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  // The cookie can only be read client-side, so the first paint is always the
  // refused state and the banner appears immediately after hydration. This is
  // the conservative direction to be wrong in.
  useEffect(() => {
    setRecord(readConsent());
    setReady(true);
  }, []);

  const commit = useCallback((choices: ConsentChoices) => {
    setRecord(writeConsent(choices));
    setPrefsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(() => {
    return {
      ready,
      record,
      allows: (category) => ready && record?.[category] === true,
      bannerOpen: ready && record === null,
      prefsOpen,
      openPrefs: () => setPrefsOpen(true),
      closePrefs: () => setPrefsOpen(false),
      acceptAll: () => commit(ALLOW_ALL),
      refuseAll: () => commit(DENY_ALL),
      save: commit,
      withdraw: () => {
        clearConsent();
        setRecord(null);
        setPrefsOpen(false);
      },
    };
  }, [ready, record, prefsOpen, commit]);

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used inside <ConsentProvider>");
  }
  return ctx;
}

"use client";

import { useNeo } from "@/components/neo/neo-context";

export function HomeContactForm() {
  const { setOpen } = useNeo();

  return (
    <div className="flex flex-col gap-6 p-8 bg-orech-slate/50 border border-orech-line rounded-2xl items-center text-center">
      <div className="w-16 h-16 bg-orech-bronze/10 rounded-full flex items-center justify-center text-orech-bronze border border-orech-bronze/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
      <div>
        <h4 className="text-xl font-display text-orech-ink font-light tracking-tight mb-2">Authenticated Legal Intake</h4>
        <p className="text-sm text-orech-mist max-w-sm">
          Static forms have been disabled to protect client privacy. All inquiries must be securely routed through the Neo Legal Assistant.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block rounded-xl bg-orech-bronze px-8 py-3.5 text-center text-sm font-medium text-white transition hover:bg-orech-bronzeMuted hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] w-full sm:w-auto"
      >
        Open Secure Intake Portal →
      </button>
    </div>
  );
}

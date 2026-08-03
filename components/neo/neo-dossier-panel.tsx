"use client";

import { useNeo } from "./neo-context";
import { NeoCaseFileView } from "./neo-case-file-view";
import { useTranslations } from "next-intl";

/**
 * Live evolving case file shown beside the conversation in the Case Room.
 *
 * Thin wrapper around NeoCaseFileView so the panel can carry its own
 * scroll container, header, and submission-aware footer note. The actual
 * structured case file rendering lives in NeoCaseFileView, which uses
 * the deterministic builder in lib/neo/case-file-builder.ts.
 *
 * Strict rules:
 * - No phone/email/address shown here. The case file is FOR the lawyer;
 *   visitors reach the office via the explicit Contact page.
 * - Practice area suggestion comes only from PUBLISHED_PRACTICE_AREAS.
 * - Empty states are shown plainly; we never fabricate facts to fill the panel.
 */
export function NeoDossierPanel() {
  const { messages, state } = useNeo();
  const t = useTranslations("NeoCaseFile");

  return (
    <aside
      aria-label="Case file"
      data-testid="neo-dossier-panel"
      className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto border-orech-line bg-orech-paper/60 px-5 py-6 lg:border-l"
    >
      <header className="space-y-1">
        <p className="text-[0.7rem] font-mono uppercase tracking-[0.18em] text-orech-mist">{t("panelTitle")}</p>
        <h2 className="font-display text-[1.05rem] text-orech-ink">
          {messages.length === 0 ? t("panelEmpty") : t("panelBuilding")}
        </h2>
        <p className="text-[0.74rem] italic text-orech-mist/80">
          {t("panelSubtitle")}
        </p>
      </header>

      <NeoCaseFileView />

      <p className="text-[0.7rem] italic text-orech-mist">
        {t("panelFooter")}{state === "SUBMITTED_FOR_LEGAL_REVIEW" ? t("panelSubmitted") : ""}
      </p>
    </aside>
  );
}

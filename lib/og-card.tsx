/* eslint-disable react/no-unknown-property */
import { SITE } from "@/lib/site";

/**
 * The share-preview card shown when a link to the site is pasted into WhatsApp,
 * LinkedIn, Slack and so on. Open Graph and Twitter use the same card.
 *
 * Brand colours only (white, black, #95b6df, #d0e1ee) and the wording of the
 * approved home page: the firm's name, "Boutique Law Office", the location and
 * the headline. The earlier card still used a cream and brown palette and a
 * description listing employment law, which the brief says not to promote.
 */
export function OgCard() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 88px",
        background: "linear-gradient(180deg, #ffffff 0%, #d0e1ee 100%)",
        color: "#000000",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 20,
          letterSpacing: 5,
          color: "#333333",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "block", width: 56, height: 4, background: "#95b6df" }} />
        {SITE.shortName} · {SITE.address.city}, {SITE.address.country}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontSize: 150, lineHeight: 1, letterSpacing: -2, fontWeight: 700 }}>{SITE.title}</div>
        <div style={{ fontSize: 46, lineHeight: 1.2, maxWidth: 940, color: "#333333" }}>
          Legal assistance when it matters the most.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 24,
          color: "#333333",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <span>{SITE.address.singleLine}</span>
        <span style={{ fontWeight: 700 }}>{SITE.website}</span>
      </div>
    </div>
  );
}

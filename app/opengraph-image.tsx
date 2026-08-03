/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const runtime = "edge";
export const alt = "Orechdin — Law Office, Antwerp";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

/**
 * Default Open Graph image for the Orechdin website.
 *
 * Editorial layout: bronze hairline rule, italic eyebrow, large
 * Playfair-style serif wordmark, Antwerp address line. Generated via
 * `next/og` so we never need to ship a binary or maintain a Photoshop
 * file. Same image is reused for Twitter via `app/twitter-image.tsx`.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background:
            "linear-gradient(180deg, #f5efe6 0%, #efe7d8 100%)",
          color: "#1a1814",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 18,
            letterSpacing: 6,
            color: "#5e564d",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              display: "block",
              width: 56,
              height: 2,
              background:
                "linear-gradient(90deg, #8a6230 0%, #b08247 100%)",
            }}
          />
          Law Office · Antwerp · Since 1999
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 168,
              lineHeight: 1,
              letterSpacing: -2,
              fontWeight: 600,
            }}
          >
            Orechdin
          </div>
          <div
            style={{
              fontStyle: "italic",
              fontSize: 44,
              lineHeight: 1.15,
              maxWidth: 920,
              color: "#3a342c",
            }}
          >
            Counsel for commercial, civil, criminal,
            family, employment & real-estate matters.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "#3a342c",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <span>{SITE.address.singleLine}</span>
          <span style={{ fontWeight: 600, letterSpacing: 1 }}>
            {SITE.url.replace(/^https?:\/\//, "")}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

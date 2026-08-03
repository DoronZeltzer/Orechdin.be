/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 } as const;
export const contentType = "image/png";

/**
 * Apple touch icon — a single italic "O" on the editorial paper
 * background, framed by a thin bronze hairline. Generated at the edge
 * so we never ship a binary.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1814",
          color: "#f5efe6",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 130,
          letterSpacing: -4,
          borderRadius: 36,
        }}
      >
        O
      </div>
    ),
    { ...size },
  );
}

/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 } as const;
export const contentType = "image/png";

/**
 * Apple touch icon: a black "O" on the brand accent blue (#95b6df), with the
 * wordmark's diagonal slash. Brand colours only. Generated at the edge so no
 * binary has to be shipped.
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
          position: "relative",
          background: "#95b6df",
          color: "#000000",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 700,
          fontSize: 120,
          borderRadius: 36,
        }}
      >
        O
        <div
          style={{
            position: "absolute",
            left: 112,
            top: 22,
            width: 8,
            height: 136,
            background: "#000000",
            transform: "rotate(16deg)",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og-card";

export const runtime = "edge";
export const alt = "ORECH/DIN, Boutique Law Office in Antwerp, Belgium";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

// Open Graph and Twitter share one card (lib/og-card.tsx). The route files are
// separate because Next.js must see `runtime` and `size` declared in each.
export default async function TwitterImage() {
  return new ImageResponse(<OgCard />, { ...size });
}

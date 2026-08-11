import type { Config } from "tailwindcss";

/**
 * Orechdin design tokens.
 *
 * The palette and type stack are tuned for an Antwerp law firm — closer to a
 * museum monograph than a marketing site. Rules of the system:
 *
 *   1. Type
 *      - `font-display`        → Playfair Display, light/regular weights, headlines.
 *      - `font-display-italic` → Cormorant Garamond Italic, used for the
 *                                  firm's signature italic pulls (eyebrows, em
 *                                  in headlines, pull quotes).
 *      - `font-prose`          → Source Serif 4, all long-form body copy.
 *      - `font-sans`           → Inter, UI chrome only (nav, buttons, labels).
 *      - `font-mono`           → JetBrains Mono, monospaced eyebrows/numerics.
 *
 *   2. Colour
 *      - Ink, paper, mist, slate, line, bronze.
 *      - Bronze is the accent, NEVER a brand surface. Use it for one element
 *        per viewport at most.
 *
 *   3. Geometry
 *      - Container widths capped at `editorial` (66rem) for prose-heavy work
 *        and `wide` (78rem) for two-column layouts.
 *      - Hairline borders (`hairline` shadow) carry more authority than a
 *        1px border in this palette.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (per Orechdin Brand Guidelines): white + black base,
        // with the #95b6df blue as the single accent and #d0e1ee as the light
        // overlay/surface tint. Token NAMES are kept (bronze/slate/etc.) so the
        // whole component tree adopts the new palette without edits — only the
        // VALUES change.
        orech: {
          ink: "#0A0A0A", // brand black — text & logo
          slate: "#DCE8F5", // light blue surface (from the #d0e1ee family)
          mist: "#5C6674", // cool neutral grey for muted/secondary text
          paper: "#FFFFFF", // brand white — the base surface
          bronze: "#95B6DF", // brand accent blue — bars, rules, focus, fills
          bronzeMuted: "#3E6DA6", // deeper blue for accent TEXT/links (legible on white)
          gold: "#6E97C9", // secondary blue for subtle highlights
          line: "#DCE6F1", // hairline: soft blue-grey
          lineSoft: "rgba(10,10,10,0.08)", // hairline-on-white at low alpha
        },
        neo: {
          panel: "#0A0A0A", // brand black panel
          surface: "#161616",
          border: "#2A2A2A",
          accent: "#95B6DF", // brand accent on dark
          muted: "rgba(255,255,255,0.6)",
        },
      },
      fontFamily: {
        // Composed, light-weight headline serif.
        display: ["var(--font-display)", "Georgia", "serif"],
        // The firm's italic — used surgically (em in h1/h2, eyebrow italics).
        "display-italic": [
          "var(--font-display-italic)",
          "Georgia",
          "serif",
        ],
        // Academic body face for long-form prose (lead paragraphs onward).
        prose: [
          "var(--font-prose)",
          "Charter",
          "Iowan Old Style",
          "Georgia",
          "serif",
        ],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        editorial: "66rem", // canonical reading column for prose pages
        wide: "78rem", // two-column / hero
        narrow: "42rem", // a single ideal-measure column
      },
      letterSpacing: {
        editorial: "-0.022em", // headline tightening for Playfair
        eyebrow: "0.18em", // monospace label tracking
      },
      lineHeight: {
        editorial: "1.7", // body prose
        headline: "1.05", // hero
      },
      boxShadow: {
        // Hairline-on-paper, used in place of a 1px border on premium cards.
        hairline: "0 0 0 1px rgba(24,20,18,0.08)",
        // Lifted hairline for hover states.
        hairlineLift:
          "0 0 0 1px rgba(24,20,18,0.10), 0 18px 40px -24px rgba(24,20,18,0.18)",
        // Editorial portrait/photo shadow.
        plate:
          "0 1px 1px rgba(24,20,18,0.04), 0 28px 60px -24px rgba(24,20,18,0.30)",
        neo: "0 0 0 1px rgba(255,255,255,0.06), -12px 0 48px rgba(0,0,0,0.35)",
        "neo-glass":
          "-12px 0 40px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.4)",
      },
      transitionTimingFunction: {
        neo: "cubic-bezier(0.19, 1, 0.22, 1)",
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        neo: "280ms",
      },
    },
  },
  plugins: [],
};

export default config;

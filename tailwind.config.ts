import type { Config } from "tailwindcss";

/**
 * Orechdin design tokens, taken from the Brand Guidelines PDF and nothing else.
 *
 *   1. Colour (guidelines section 03)
 *      - White `#ffffff` and black `#000000`, with black tints at 80/60/40/20%.
 *      - Accent blue `#95b6df`: "the main colour", usable for any element or
 *        background. On white it is too pale to carry text (about 2.1:1), so it
 *        is used for fills, bars and rules, and black carries the text. Black
 *        on the blue is about 9:1.
 *      - Wash blue `#d0e1ee`: "only for the overlays and backgrounds".
 *      Nothing outside this set may be added. The previous palette had drifted:
 *      a near-black, a different pale blue, a cool grey and two extra blues.
 *
 *   2. Type (section 02)
 *      One family, Egyptian Slate Pro, stood in for here by Roboto Slab (see
 *      app/[locale]/layout.tsx for how it was chosen). Regular for text, Bold
 *      for headings. The guidelines' Copperplate is for the logo only.
 *
 *   3. Geometry
 *      - `editorial` (66rem) for prose-heavy pages, `wide` (78rem) for layouts.
 */
const slab = ["var(--font-hebrew)", "var(--font-slab)", "Rockwell", "Georgia", "serif"];

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // The brand palette under its own names. New code should use these.
        brand: {
          white: "#FFFFFF",
          black: "#000000",
          blue: "#95B6DF", // accent: fills, bars, rules, highlights
          wash: "#D0E1EE", // overlays and backgrounds only
          "black-80": "#333333",
          "black-60": "#666666",
          "black-40": "#999999",
          "black-20": "#CCCCCC",
        },
        // Older token names, mapped onto the palette above so pages that have
        // not been redesigned yet already render in brand colours.
        orech: {
          ink: "#000000", // brand black: text and logo
          paper: "#FFFFFF", // brand white: the base surface
          bronze: "#95B6DF", // brand accent blue
          slate: "#D0E1EE", // brand wash blue: backgrounds
          mist: "#666666", // black at 60%: secondary text (5.7:1 on white)
          line: "#CCCCCC", // black at 20%: hairlines
          lineSoft: "rgba(0,0,0,0.08)",
          bronzeMuted: "#000000", // was a non-brand blue for text; text is black now
          gold: "#95B6DF", // was a non-brand blue; folded into the accent
        },
      },
      fontFamily: {
        // One family for every role; the names stay so existing classes work.
        display: slab,
        "display-italic": slab,
        prose: slab,
        sans: slab,
        mono: slab,
      },
      maxWidth: {
        editorial: "66rem", // canonical reading column for prose pages
        wide: "78rem", // two-column / hero
        narrow: "42rem", // a single ideal-measure column
      },
      letterSpacing: {
        editorial: "-0.012em", // light headline tightening
        eyebrow: "0.16em", // uppercase label tracking
      },
      lineHeight: {
        editorial: "1.7", // body prose
        headline: "1.1", // hero
      },
      boxShadow: {
        // Hairline, used in place of a 1px border on cards.
        hairline: "0 0 0 1px rgba(0,0,0,0.10)",
        // Lifted hairline for hover states.
        hairlineLift:
          "0 0 0 1px rgba(0,0,0,0.14), 0 18px 40px -24px rgba(0,0,0,0.28)",
        // Portrait/photo shadow.
        plate:
          "0 1px 1px rgba(0,0,0,0.04), 0 28px 60px -24px rgba(0,0,0,0.32)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

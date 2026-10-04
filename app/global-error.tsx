"use client";

import { useEffect } from "react";

/**
 * Last-chance error boundary for failures in the root layout itself.
 * Next.js requires this file to render its own <html>/<body>, so it cannot use
 * the site's styles or fonts; it carries the brand colours inline. Kept tiny
 * and in English, the master language. The per-language error page in
 * `app/[locale]/error.tsx` handles everything inside a language segment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ORECH/DIN] global error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#d0e1ee",
          color: "#000000",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: "#333333", margin: 0 }}>
            ORECH/DIN · Boutique Law Office · Antwerp
          </p>
          <h1 style={{ fontSize: "2.25rem", lineHeight: 1.15, margin: "1.25rem 0 0.75rem", fontWeight: 700 }}>
            We&rsquo;re unable to load this page
          </h1>
          <p style={{ color: "#333333", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            An unexpected error occurred. You can try again or call the office directly on +32 3 227 50 57.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.8rem 1.75rem",
              border: "2px solid #95b6df",
              borderRadius: 8,
              background: "#95b6df",
              color: "#000000",
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Last-chance error boundary for failures in the root layout itself.
 * Next.js requires this file to render its own <html>/<body>. Kept
 * intentionally tiny and locale-neutral — the per-locale error page in
 * `app/[locale]/error.tsx` handles everything that happens inside a
 * locale segment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Orechdin] global error", {
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
          background: "#f5efe6",
          color: "#1a1814",
          fontFamily:
            "'Source Serif 4', Georgia, 'Times New Roman', serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#5e564d",
              margin: 0,
            }}
          >
            Orechdin · Law Office · Antwerp
          </p>
          <h1
            style={{
              fontFamily:
                "'Playfair Display', Georgia, 'Times New Roman', serif",
              fontSize: "2.25rem",
              lineHeight: 1.15,
              margin: "1.25rem 0 0.75rem",
              fontWeight: 600,
            }}
          >
            We&rsquo;re unable to load this page
          </h1>
          <p style={{ color: "#3a342c", margin: "0 0 1.5rem" }}>
            An unexpected error occurred. You can try again or call the
            office directly on +32 3 227 50 57.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              border: "1px solid #1a1814",
              background: "#1a1814",
              color: "#f5efe6",
              fontFamily:
                "'Inter', system-ui, -apple-system, sans-serif",
              fontSize: "0.875rem",
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

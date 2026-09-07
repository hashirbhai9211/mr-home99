"use client";

import { useEffect } from "react";

/** Same auto-recovery as app/error.tsx (root-level boundary). */
function isChunkLoadError(error: Error & { digest?: string }): boolean {
  const msg = `${error.message} ${String((error as Error & { cause?: unknown })?.cause ?? "")}`;
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk .* failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /dynamically imported module/i.test(msg)
  );
}

/** Hydration-crash family (Edge Tracking Prevention mutates DOM mid-hydration). */
function isHydrationCrash(error: Error & { digest?: string }): boolean {
  const msg = `${error.message} ${String((error as Error & { cause?: unknown })?.cause ?? "")}`;
  return (
    /removeChild|insertBefore/i.test(msg) ||
    /NotFoundError/i.test(msg) ||
    /Minified React error #(418|423|425)\b/i.test(msg) ||
    /hydration/i.test(msg)
  );
}

/** Loop-proof: URL marker instead of sessionStorage (storage may be blocked). */
function recoverByReload(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("mrhR")) return;
  url.searchParams.set("mrhR", "1");
  window.location.replace(url.toString());
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    if (isChunkLoadError(error) || isHydrationCrash(error)) recoverByReload();
  }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0f0c", color: "#f4f6f4", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3ec24a" }}>MR.HOME</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", margin: "12px 0 8px", fontWeight: 600 }}>Something went wrong.</h1>
          <p style={{ maxWidth: 420, color: "rgba(244,246,244,0.7)", fontSize: 15 }}>An unexpected issue occurred. Try again, or return to the homepage.</p>
          {error.digest ? <p style={{ marginTop: 8, fontSize: 11, color: "rgba(244,246,244,0.4)" }}>Reference: {error.digest}</p> : null}
          <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={reset}
              style={{ height: 48, padding: "0 24px", borderRadius: 999, background: "#3ec24a", color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{ height: 48, padding: "0 24px", borderRadius: 999, background: "transparent", color: "#f4f6f4", fontWeight: 500, fontSize: 14, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
            >
              Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

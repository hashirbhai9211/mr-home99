"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Crash auto-recovery.
 *
 * Two families of failures reload cleanly instead of showing an error page:
 *  1. Chunk-load failures (tab predates a deploy; hashed chunks no longer exist).
 *  2. Hydration crashes (React #418/#423/#425 whose client recovery dies with
 *     DOM NotFoundErrors — observed when browsers/extensions mutate the document
 *     mid-hydration, e.g. Edge Tracking Prevention).
 *
 * Loop-proofing uses a `?mrhR=1` URL marker — NOT sessionStorage, because storage
 * access itself can be blocked by the very browser features that cause the crash.
 * If the error survives one reload, the full error UI renders.
 */
function classifyError(error: Error & { digest?: string }): "recoverable" | "fatal" {
  const msg = `${error.message} ${String((error as Error & { cause?: unknown })?.cause ?? "")}`;
  if (error.digest === "DYNAMIC_SERVER_USAGE" || error.digest === "BAILOUT_TO_CLIENT_SIDE_RENDERING") return "fatal";
  const patterns = [
    /Failed to fetch dynamically imported module/i,
    /Loading chunk .* failed/i,
    /ChunkLoadError/i,
    /dynamically imported module/i,
    /Importing a module script failed/i,
    /removeChild|insertBefore/i,
    /NotFoundError/i,
    /Minified React error #(418|423|425)\b/i,
    /hydration/i,
  ];
  return patterns.some((p) => p.test(msg)) ? "recoverable" : "fatal";
}

function recoverByReload(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("mrhR")) return; // already retried once — show the UI
  url.searchParams.set("mrhR", "1");
  window.location.replace(url.toString());
}

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The interstitial renders immediately if this boundary should recover — set via
  // lazy initialiser (client-only component) so no setState-in-effect is needed.
  const [recovering] = useState(() => classifyError(error) === "recoverable");

  useEffect(() => {
    console.error(error);
    if (recovering) recoverByReload();
  }, [error, recovering]);

  // While auto-recovering, show a quiet branded interstitial — never the scary
  // error text (the reload usually completes in well under a second).
  if (recovering) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ivory" role="status" aria-label="Recovering">
        <div className="relative h-14 w-[220px]"><span className="text-[26px] font-bold tracking-tight text-ink">MR.H<span className="text-brand">⌂</span>ME</span></div>
        <div className="h-[2px] w-40 overflow-hidden rounded-full bg-ink/10"><div className="h-full w-1/2 animate-[shimmer_1.2s_linear_infinite] bg-brand" style={{ backgroundSize: "200% 100%" }} /></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-4 text-[clamp(2rem,5vw,3.4rem)] text-ink">We hit an unexpected issue.</h1>
      <p className="mt-4 max-w-md text-[15px] text-charcoal/75">Our team has been notified. You can try again or return to the homepage.</p>
      {error.digest && <p className="mt-2 text-[11px] text-mist">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-[14px] font-medium text-white shadow-glow hover:bg-brand-deep">Try again</button>
        <Link href="/" className="inline-flex h-12 items-center rounded-full border border-ink/10 bg-white px-6 text-[14px] font-medium text-ink hover:border-brand">Home</Link>
      </div>
    </div>
  );
}

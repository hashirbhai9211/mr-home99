"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

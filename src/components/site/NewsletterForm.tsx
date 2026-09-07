"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, website: "" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setState("done");
      setMsg(data.message || "Subscribed.");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (state === "done") return <p className="flex items-center gap-2 text-[14px] text-brand"><Check className="h-4 w-4" /> {msg}</p>;

  return (
    <form onSubmit={submit} className="relative">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="h-12 w-full rounded-full border border-ink/10 bg-white pl-4 pr-14 text-[14px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
      />
      <button type="submit" disabled={state === "loading"} aria-label="Subscribe" className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-deep disabled:opacity-60">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      </button>
      {state === "error" && <p className="mt-2 text-[12px] text-red-600" role="alert">{msg}</p>}
    </form>
  );
}

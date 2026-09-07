"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { cn } from "@/lib/utils";

export type FormMarket = { id: number; name: string; slug: string; flag: string; cities?: string[] | null };
export type FormProject = { id: number; name: string; marketId: number | null };

type Props = {
  fields: string[];
  markets: FormMarket[];
  projects: FormProject[];
  budgetOptions: string[];
  interestOptions: string[];
  defaultMarketId?: number | null;
  defaultProjectId?: number | null;
  source?: string;
  compact?: boolean;
  dark?: boolean;
  submitLabel?: string;
  cityFieldEnabled?: boolean;
  customBudgetEnabled?: boolean;
};

type State = { status: "idle" | "loading" | "success" | "error"; message?: string; issues?: Record<string, string> };

function Field({ name, label, error, children }: { name: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`inq-${name}`} className="sr-only">{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px] text-red-600" role="alert">{error}</p>}
    </div>
  );
}

const inputCls = "h-12 w-full rounded-xl border border-ink/10 bg-white px-4 text-[14px] text-ink outline-none transition placeholder:text-mist focus:border-brand focus:ring-4 focus:ring-brand/10";

export function InquiryForm({ fields, markets, projects, budgetOptions, interestOptions, defaultMarketId, defaultProjectId, source = "website", compact, submitLabel = "Submit Inquiry", cityFieldEnabled = false, customBudgetEnabled = false }: Props) {
  const pathname = usePathname();
  const [state, setState] = useState<State>({ status: "idle" });
  const [marketId, setMarketId] = useState<string>(defaultMarketId ? String(defaultMarketId) : "");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ? String(defaultProjectId) : "");
  const [city, setCity] = useState<string>("");
  const [budgetSel, setBudgetSel] = useState<string>("");
  const [customBudget, setCustomBudget] = useState("");
  const showCustomBudget = customBudgetEnabled && budgetOptions.includes("Custom");
  const has = (f: string) => fields.includes(f);
  const visibleProjects = useMemo(() => (marketId ? projects.filter((p) => String(p.marketId) === marketId) : projects), [projects, marketId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    payload.page = pathname;
    payload.source = source;
    payload.campaign = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined : undefined;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const issues: Record<string, string> = {};
        (data.issues ?? []).forEach((i: { path: string; message: string }) => { issues[i.path] = i.message; });
        setState({ status: "error", message: data.error || "Submission failed", issues });
        return;
      }
      setState({ status: "success", message: data.message });
      form.reset();
    } catch {
      setState({ status: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  const err = (k: string) => state.issues?.[k];

  if (state.status === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center rounded-3xl bg-white p-10 text-center shadow-card" role="status">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand"><Check className="h-8 w-8" /></span>
        <h3 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">Thank you — we’ve received your inquiry.</h3>
        <p className="mt-2 max-w-sm text-[14.5px] text-charcoal/75">{state.message || "An MR.HOME advisor will contact you within one business day."}</p>
        <button type="button" onClick={() => setState({ status: "idle" })} className="mt-6 text-[13px] font-medium text-brand underline-offset-4 hover:underline">Send another inquiry</button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("relative rounded-3xl bg-white/85 p-5 shadow-card backdrop-blur sm:p-6", compact && "p-4 sm:p-5")} aria-label="Property inquiry form">
      {/* Honeypot — hidden from humans */}
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {has("name") && <Field name="name" label="Full name" error={err("name")}><input id="inq-name" name="name" required placeholder="Full Name" className={inputCls} autoComplete="name" /></Field>}
        {has("email") && <Field name="email" label="Email" error={err("email")}><input id="inq-email" name="email" type="email" required placeholder="Email Address" className={inputCls} autoComplete="email" /></Field>}
        {has("phone") && <Field name="phone" label="Phone / WhatsApp" error={err("phone")}><input id="inq-phone" name="phone" type="tel" placeholder="Phone / WhatsApp" className={inputCls} autoComplete="tel" /></Field>}
        {has("country") && <Field name="country" label="Country" error={err("country")}><input id="inq-country" name="country" placeholder="Country of Residence" className={inputCls} autoComplete="country-name" /></Field>}
        {has("market") && (
          <Field name="marketId" label="Preferred market" error={err("marketId")}>
            <select id="inq-marketId" name="marketId" value={marketId} onChange={(e) => { setMarketId(e.target.value); setProjectId(""); }} className={inputCls}>
              <option value="">Preferred Market</option>
              {markets.map((m) => <option key={m.id} value={m.id}>{m.flag} {m.name}</option>)}
            </select>
          </Field>
        )}
        {has("project") && (
          <Field name="projectId" label="Project" error={err("projectId")}>
            <select id="inq-projectId" name="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
              <option value="">Project of Interest (optional)</option>
              {visibleProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
        {has("interest") && (
          <Field name="interest" label="Interested in" error={err("interest")}>
            <select id="inq-interest" name="interest" defaultValue="" className={inputCls}>
              <option value="">Interested In</option>
              {interestOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        )}
        {has("market") && cityFieldEnabled && (
          <Field name="city" label="City" error={err("city")}>
            <select id="inq-city" name="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} disabled={!marketId}>
              <option value="">{marketId ? "Preferred City" : "Select a market first"}</option>
              {(markets.find((m) => String(m.id) === marketId)?.cities ?? []).filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        )}
        {has("budget") && (
          <Field name="budget" label="Estimated budget" error={err("budget")}>
            <select id="inq-budget" name="budget" value={budgetSel} onChange={(e) => setBudgetSel(e.target.value)} className={inputCls}>
              <option value="">Estimated Budget</option>
              {budgetOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        )}
        {showCustomBudget && has("budget") && budgetSel === "Custom" && (
          <Field name="customBudget" label="Custom budget amount">
            <input
              id="inq-customBudget"
              name="customBudget"
              type="text"
              inputMode="numeric"
              placeholder="Enter your budget (e.g. AED 1.5M / $750,000)"
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              className={inputCls}
              autoComplete="off"
            />
          </Field>
        )}
        {has("whatsapp") && <Field name="whatsapp" label="WhatsApp" error={err("whatsapp")}><input id="inq-whatsapp" name="whatsapp" type="tel" placeholder="WhatsApp Number" className={inputCls} /></Field>}
        {has("message") && (
          <div className="sm:col-span-2">
            <label htmlFor="inq-message" className="sr-only">Message</label>
            <textarea id="inq-message" name="message" rows={compact ? 3 : 4} placeholder="Message" className={cn(inputCls, "h-auto py-3")} />
            {err("message") && <p className="mt-1 text-[12px] text-red-600">{err("message")}</p>}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-mist">By submitting you agree to our <Link href="/privacy-policy" className="underline underline-offset-2">Privacy Policy</Link>.</p>
        <Button3D type="submit" disabled={state.status === "loading"} icon={state.status === "loading" ? "none" : "arrow"}>
          {state.status === "loading" ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending…</span> : submitLabel}
        </Button3D>
      </div>
      <AnimatePresence>
        {state.status === "error" && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700"><AlertCircle className="h-4 w-4" />{state.message}</motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}

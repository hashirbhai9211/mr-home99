"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Btn, inputCls, labelCls } from "@/components/admin/ui";

export default function SetupPage() {
  const router = useRouter();
  const [info, setInfo] = useState<{ needsSetup: boolean; email: string; requiresToken: boolean } | null>(null);
  const [form, setForm] = useState({ name: "", password: "", confirm: "", setupToken: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup").then((r) => r.json()).then((d) => { setInfo(d); if (!d.needsSetup) router.replace("/admin/login"); }).catch(() => setError("Unable to reach the server."));
  }, [router]);

  const strength = [/.{12,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.issues?.map((i: { message: string }) => i.message).join(", ") || data.error || "Setup failed");
      router.replace("/admin");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Setup failed"); } finally { setBusy(false); }
  }

  if (!info) return <div className="skeleton h-96 rounded-3xl" />;

  return (
    <div className="rounded-3xl border border-ink/8 bg-white p-8 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand"><ShieldCheck className="h-5 w-5" /></span>
      <h1 className="mt-5 text-[24px] font-semibold tracking-tight text-ink">Secure initial setup</h1>
      <p className="mt-1 text-[13.5px] text-charcoal/70">Create the password for the administrator account <strong className="text-ink">{info.email}</strong>. This screen is only available once — no default password exists.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="name" className={labelCls}>Your name</label><input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} autoComplete="name" /></div>
        <div>
          <label htmlFor="password" className={labelCls}>Password</label>
          <input id="password" type="password" required minLength={12} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} autoComplete="new-password" />
          <div className="mt-2 flex gap-1">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < strength ? (strength >= 4 ? "bg-brand" : "bg-amber-400") : "bg-slate-200"}`} />)}</div>
          <p className="mt-1 text-[11.5px] text-mist">Min 12 characters with uppercase, lowercase and a number.</p>
        </div>
        <div><label htmlFor="confirm" className={labelCls}>Confirm password</label><input id="confirm" type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputCls} autoComplete="new-password" /></div>
        {info.requiresToken && <div><label htmlFor="token" className={labelCls}>Setup token</label><input id="token" required value={form.setupToken} onChange={(e) => setForm({ ...form, setupToken: e.target.value })} className={inputCls} /><p className="mt-1 text-[11.5px] text-mist">Provided via the ADMIN_SETUP_TOKEN environment variable.</p></div>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
        <Btn type="submit" loading={busy} className="w-full">Create administrator account</Btn>
      </form>
    </div>
  );
}

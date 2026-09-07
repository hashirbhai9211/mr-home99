"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Btn, inputCls, labelCls } from "@/components/admin/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup").then((r) => r.json()).then((d) => { if (d.needsSetup) router.replace("/admin/setup"); }).catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed");
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-3xl border border-ink/8 bg-white p-8 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Lock className="h-5 w-5" /></span>
      <h1 className="mt-5 text-[24px] font-semibold tracking-tight text-ink">Sign in to Admin</h1>
      <p className="mt-1 text-[13.5px] text-charcoal/70">Authorised personnel only. All activity is logged.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="email" className={labelCls}>Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
        <div><label htmlFor="password" className={labelCls}>Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
        <Btn type="submit" loading={busy} className="w-full">Sign in</Btn>
      </form>
      <p className="mt-6 text-center text-[12px] text-mist"><Link href="/" className="hover:text-brand">← Back to website</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="skeleton h-96 rounded-3xl" />}><LoginForm /></Suspense>;
}

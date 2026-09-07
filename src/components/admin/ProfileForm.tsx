"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, Btn, inputCls, labelCls, useToast } from "./ui";

export function ProfileForm({ name: initialName }: { name: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState<"name" | "pw" | null>(null);

  const saveName = async (e: React.FormEvent) => { e.preventDefault(); setBusy("name"); try { await api("/api/auth/password", { method: "PATCH", body: JSON.stringify({ name }) }); toast("Profile updated"); router.refresh(); } catch (err) { toast((err as Error).message, "error"); } finally { setBusy(null); } };
  const savePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast("New passwords do not match", "error");
    setBusy("pw");
    try { await api("/api/auth/password", { method: "POST", body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }) }); toast("Password changed. Other sessions were signed out."); setPw({ currentPassword: "", newPassword: "", confirm: "" }); } catch (err) { toast((err as Error).message, "error"); } finally { setBusy(null); }
  };

  return (
    <>
      <form onSubmit={saveName} className="space-y-4 rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold">Display name</h2>
        <div><label htmlFor="name" className={labelCls}>Name</label><input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required minLength={2} /></div>
        <Btn type="submit" loading={busy === "name"}>Save</Btn>
      </form>
      <form onSubmit={savePw} className="space-y-4 rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold">Change password</h2>
        <div><label htmlFor="cur" className={labelCls}>Current password</label><input id="cur" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={inputCls} required /></div>
        <div><label htmlFor="new" className={labelCls}>New password</label><input id="new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={inputCls} required minLength={12} /><p className="mt-1 text-[11.5px] text-mist">Min 12 characters including an uppercase letter and a number.</p></div>
        <div><label htmlFor="conf" className={labelCls}>Confirm new password</label><input id="conf" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={inputCls} required /></div>
        <Btn type="submit" loading={busy === "pw"}>Change password</Btn>
      </form>
    </>
  );
}

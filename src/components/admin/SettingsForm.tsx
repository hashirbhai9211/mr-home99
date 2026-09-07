"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { SiteSettings } from "@/lib/settings-types";
import { cn } from "@/lib/utils";
import { api, Btn, inputCls, labelCls, useToast } from "./ui";
import { ImageInput } from "./FieldInput";

type Tab = { key: string; label: string };
const TABS: Tab[] = [
  { key: "general", label: "General & Brand" }, { key: "contact", label: "Contact" }, { key: "social", label: "Social" }, { key: "footer", label: "Footer" },
  { key: "seo", label: "SEO & Analytics" }, { key: "whatsapp", label: "WhatsApp" }, { key: "forms", label: "Forms & Newsletter" }, { key: "intro", label: "Intro Video" }, { key: "legal", label: "Consent & Disclaimer" },
];

const ALL_FIELDS = ["name", "email", "phone", "whatsapp", "country", "market", "project", "budget", "interest", "message"];

type Setter = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;

function Text({ s, set, k, label, help, type = "text", canWrite }: { s: SiteSettings; set: Setter; k: keyof SiteSettings; label: string; help?: string; type?: string; canWrite: boolean }) {
  return (
    <div>
      <label htmlFor={String(k)} className={labelCls}>{label}</label>
      <input id={String(k)} type={type} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} className={inputCls} disabled={!canWrite} />
      {help && <p className="mt-1 text-[11.5px] text-mist">{help}</p>}
    </div>
  );
}

function Area({ s, set, k, label, help, canWrite }: { s: SiteSettings; set: Setter; k: keyof SiteSettings; label: string; help?: string; canWrite: boolean }) {
  return (
    <div>
      <label htmlFor={String(k)} className={labelCls}>{label}</label>
      <textarea id={String(k)} rows={3} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} className={cn(inputCls, "h-auto py-2")} disabled={!canWrite} />
      {help && <p className="mt-1 text-[11.5px] text-mist">{help}</p>}
    </div>
  );
}

function Toggle({ s, set, k, label, canWrite }: { s: SiteSettings; set: Setter; k: keyof SiteSettings; label: string; canWrite: boolean }) {
  const on = !!s[k];
  return (
    <label className="flex items-center gap-3">
      <button type="button" role="switch" aria-checked={on} disabled={!canWrite} onClick={() => set(k, !on as never)} className={cn("relative h-6 w-11 rounded-full transition", on ? "bg-brand" : "bg-slate-300")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", on ? "left-[22px]" : "left-0.5")} />
      </button>
      <span className="text-[13.5px]">{label}</span>
    </label>
  );
}

function Lines({ s, set, k, label, help, canWrite }: { s: SiteSettings; set: Setter; k: "budgetOptions" | "interestOptions"; label: string; help?: string; canWrite: boolean }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea
        rows={6}
        value={s[k].join("\n")}
        onChange={(e) => set(k, e.target.value.split("\n"))}
        onBlur={(e) => set(k, e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))}
        className={cn(inputCls, "h-auto py-2")}
        disabled={!canWrite}
      />
      <p className="mt-1 text-[11.5px] text-mist">{help ?? "One option per line."}</p>
    </div>
  );
}

type RowRecord = Record<string, string | undefined>;
type RowKey = "offices" | "socialLinks" | "footerLinks";

function Rows({ s, set, k, cols, label, canWrite }: { s: SiteSettings; set: Setter; k: RowKey; cols: { key: string; label: string; placeholder?: string }[]; label: string; canWrite: boolean }) {
  const arr = s[k] as unknown as RowRecord[];
  const update = (i: number, key: string, v: string) => set(k, arr.map((r, j) => (j === i ? { ...r, [key]: v } : r)) as never);
  return (
    <div>
      <div className={labelCls}>{label}</div>
      <div className="space-y-2">
        {arr.map((row, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-ink/8 bg-slate-50/60 p-3 md:grid-cols-12">
            {cols.map((c) => (
              <div key={c.key} className={cn(cols.length > 3 ? "md:col-span-6" : "md:col-span-5")}>
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-mist">{c.label}</label>
                <input value={row[c.key] ?? ""} placeholder={c.placeholder} onChange={(e) => update(i, c.key, e.target.value)} className={inputCls} disabled={!canWrite} />
              </div>
            ))}
            {canWrite && (
              <div className="flex items-end md:col-span-2">
                <button type="button" onClick={() => set(k, arr.filter((_, j) => j !== i) as never)} className="inline-flex items-center gap-1 text-[12px] text-red-600 hover:underline">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        ))}
        {canWrite && <Btn type="button" size="sm" variant="secondary" onClick={() => set(k, [...arr, {}] as never)}><Plus className="h-3.5 w-3.5" /> Add</Btn>}
      </div>
    </div>
  );
}

export function SettingsForm({ canWrite }: { canWrite: boolean }) {
  const { toast } = useToast();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);

  useEffect(() => { api<{ data: SiteSettings }>("/api/admin/settings").then((d) => setS(d.data)).catch((e) => toast(e.message, "error")); }, [toast]);

  if (!s) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>;

  const set: Setter = (k, v) => setS({ ...s, [k]: v });
  const save = async () => {
    setSaving(true);
    try { const d = await api<{ data: SiteSettings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(s) }); setS(d.data); toast("Settings saved — the public site is updated"); } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };
  const textProps = { s, set, canWrite } as const;

  return (
    <div className="space-y-5">
      <div><h1 className="text-[22px] font-semibold tracking-tight">Settings</h1><p className="text-[13px] text-mist">Central business information. Every change propagates to the public website instantly.</p></div>
      <div className="flex flex-wrap gap-1 rounded-2xl border border-ink/8 bg-white p-1.5 shadow-sm">{TABS.map((t) => <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-xl px-3 py-2 text-[13px] font-medium transition", tab === t.key ? "bg-brand text-white" : "text-charcoal hover:bg-slate-100")}>{t.label}</button>)}</div>

      <div className="space-y-5 rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
        {tab === "general" && (<>
          <div className="grid gap-4 md:grid-cols-2"><Text {...textProps} k="brandName" label="Brand name" /><Text {...textProps} k="tagline" label="Tagline" /></div>
          <div><label className={labelCls}>Logo (light backgrounds)</label><ImageInput value={s.logo} onChange={(v) => set("logo", v)} /><p className="mt-1 text-[11.5px] text-mist">Upload the exact MR.HOME logo file (SVG/PNG) to the Media Library and select it here.</p></div>
          <div><label className={labelCls}>Logo (dark backgrounds)</label><ImageInput value={s.logoDark} onChange={(v) => set("logoDark", v)} /></div>
          <div><label className={labelCls}>Favicon</label><ImageInput value={s.favicon} onChange={(v) => set("favicon", v)} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelCls}>Primary green</label><div className="flex gap-2"><input type="color" value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-10 w-14 rounded-lg border border-ink/10" aria-label="Primary colour" /><input value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className={inputCls} /></div></div>
            <div><label className={labelCls}>Accent green</label><div className="flex gap-2"><input type="color" value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-10 w-14 rounded-lg border border-ink/10" aria-label="Accent colour" /><input value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)} className={inputCls} /></div></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2"><Text {...textProps} k="announcement" label="Announcement bar text" /><div className="pt-7"><Toggle {...textProps} k="announcementEnabled" label="Show announcement bar" /></div></div>
        </>)}
        {tab === "contact" && (<>
          <div className="grid gap-4 md:grid-cols-2"><Text {...textProps} k="phone" label="Phone (displayed)" /><Text {...textProps} k="whatsapp" label="WhatsApp number" help="International format, digits only preferred e.g. +971501234567" /><Text {...textProps} k="email" label="Email" type="email" /><Text {...textProps} k="workingHours" label="Working hours" /></div>
          <Text {...textProps} k="address" label="Head office address" /><Text {...textProps} k="mapUrl" label="Map link" />
          <Rows {...{ s, set, canWrite }} k="offices" label="Office locations" cols={[{ key: "name", label: "Name" }, { key: "address", label: "Address" }, { key: "phone", label: "Phone" }, { key: "hours", label: "Hours" }, { key: "mapUrl", label: "Map URL" }]} />
        </>)}
        {tab === "social" && <Rows {...{ s, set, canWrite }} k="socialLinks" label="Social links" cols={[{ key: "platform", label: "Platform", placeholder: "instagram / facebook / linkedin / youtube / x" }, { key: "url", label: "URL" }]} />}
        {tab === "footer" && (<>
          <Area {...textProps} k="footerDescription" label="Footer description" />
          <Text {...textProps} k="copyrightText" label="Copyright text" help="The year is added automatically: © {current year} + this text." />
          <Rows {...{ s, set, canWrite }} k="footerLinks" label="Legal / footer links" cols={[{ key: "label", label: "Label" }, { key: "href", label: "URL" }]} />
        </>)}
        {tab === "seo" && (<>
          <Text {...textProps} k="siteUrl" label="Canonical site URL" help="e.g. https://mrhome.com — used for sitemap and Open Graph." />
          <Text {...textProps} k="seoDefaultTitle" label="Default title" /><Area {...textProps} k="seoDefaultDescription" label="Default description" />
          <div><label className={labelCls}>Default Open Graph image</label><ImageInput value={s.seoOgImage} onChange={(v) => set("seoOgImage", v)} /></div>
          <div className="grid gap-4 md:grid-cols-2"><Text {...textProps} k="gaId" label="Google Analytics ID" help="Loaded only after cookie consent." /><Text {...textProps} k="metaPixelId" label="Meta Pixel ID" /></div>
        </>)}
        {tab === "whatsapp" && (<>
          <Text {...textProps} k="whatsapp" label="Default WhatsApp number" />
          <Area {...textProps} k="whatsappDefaultMessage" label="General message template" />
          <Area {...textProps} k="whatsappProjectMessage" label="Project inquiry template" help="Variables: {{project}}, {{market}}" />
          <Area {...textProps} k="whatsappMarketMessage" label="Market inquiry template" help="Variables: {{market}}" />
        </>)}
        {tab === "forms" && (<>
          <div><div className={labelCls}>Inquiry form fields</div><div className="flex flex-wrap gap-2">{ALL_FIELDS.map((f) => <label key={f} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px]", s.contactFields.includes(f) ? "border-brand bg-brand/10 text-brand" : "border-ink/10")}><input type="checkbox" className="sr-only" disabled={!canWrite} checked={s.contactFields.includes(f)} onChange={(e) => set("contactFields", e.target.checked ? [...s.contactFields, f] : s.contactFields.filter((x) => x !== f))} />{f}</label>)}</div><p className="mt-1 text-[11.5px] text-mist">Name and email are always required for a valid lead.</p></div>
          <div className="grid gap-4 md:grid-cols-2"><Lines {...textProps} k="budgetOptions" label="Budget options" help="Add the exact option “Custom” to let visitors enter their own budget amount." /><Lines {...textProps} k="interestOptions" label="Property interest options" /></div>
          <div className="grid gap-4 md:grid-cols-2"><Toggle {...textProps} k="cityFieldEnabled" label="Show city dropdown on inquiry forms (options come from each market's cities)" /><Toggle {...textProps} k="customBudgetEnabled" label="Allow custom budget amounts (requires a “Custom” budget option)" /></div>
          <div className="grid gap-4 md:grid-cols-2"><Text {...textProps} k="newsletterTitle" label="Newsletter title" /><Text {...textProps} k="newsletterDescription" label="Newsletter description" /></div>
          <Toggle {...textProps} k="newsletterEnabled" label="Enable newsletter signup in footer" />
        </>)}
        {tab === "intro" && (<>
          <Toggle {...textProps} k="introVideoEnabled" label="Play intro video on homepage (once per session)" />
          <Text {...textProps} k="introVideoUrl" label="Intro video URL" help="Default is the supplied Cloudinary asset with the audio track stripped (ac_none)." />
          <div><label className={labelCls}>Poster image</label><ImageInput value={s.introVideoPoster} onChange={(v) => set("introVideoPoster", v)} /></div>
        </>)}
        {tab === "legal" && (<><Area {...textProps} k="cookieConsentText" label="Cookie consent text" /><Area {...textProps} k="disclaimer" label="Real estate disclaimer" /></>)}
      </div>
      {canWrite && <div className="sticky bottom-4 flex justify-end rounded-2xl border border-ink/8 bg-white/90 p-3 shadow-lg backdrop-blur"><Btn loading={saving} onClick={save}>Save settings</Btn></div>}
    </div>
  );
}

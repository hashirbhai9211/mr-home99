"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";

const KEY = "mrh_cookie_consent";

function loadAnalytics(gaId: string) {
  if (!gaId || document.getElementById("ga-script")) return;
  const s = document.createElement("script");
  s.id = "ga-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(s);
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag(...args: unknown[]) { w.dataLayer.push(args); };
  w.gtag("js", new Date());
  w.gtag("config", gaId);
}

export function CookieConsent({ text, gaId }: { text: string; gaId: string }) {
  // Hydration-safe: SSR + first client render must agree (hidden). localStorage is
  // read in useSyncExternalStore's client snapshot AFTER hydration, so the banner
  // can never cause a hydration mismatch — even when storage is blocked/empty.
  const consentStore = {
    subscribe(cb: () => void) {
      window.addEventListener("mrh:consent", cb);
      return () => window.removeEventListener("mrh:consent", cb);
    },
    getSnapshot() {
      try { return localStorage.getItem(KEY) ?? ""; } catch { return "done"; }
    },
    getServerSnapshot() {
      return "";
    },
  };
  const consent = useSyncExternalStore(consentStore.subscribe, consentStore.getSnapshot, consentStore.getServerSnapshot);
  const [show, setShow] = useState(false);
  // Reveal decision happens in a microtask after hydration — reading storage here
  // can no longer mismatch SSR HTML, and no setState-in-effect pattern is used.
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      try {
        setShow(localStorage.getItem(KEY) === null);
      } catch {
        setShow(true); // storage blocked → treat as undecided rather than hiding forever
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);
  // Load analytics only for previously-consenting visitors. External-system
  // subscription with a callback, no setState in the effect body.
  useEffect(() => {
    if (consent !== "accepted") return;
    loadAnalytics(gaId);
  }, [gaId, consent]);

  const decide = (v: "accepted" | "declined") => {
    try { localStorage.setItem(KEY, v); } catch { /* storage blocked */ }
    window.dispatchEvent(new Event("mrh:consent"));
    setShow(false);
    if (v === "accepted") loadAnalytics(gaId);
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div role="dialog" aria-live="polite" aria-label="Cookie consent" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="fixed bottom-4 left-4 right-4 z-[80] sm:left-auto sm:right-6 sm:max-w-md">
          <div className="glass rounded-3xl p-5 shadow-card">
            <p className="text-[13px] leading-relaxed text-charcoal">{text} <Link href="/cookie-policy" className="text-brand underline-offset-2 hover:underline">Cookie Policy</Link></p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => decide("accepted")} className="h-10 flex-1 rounded-full bg-brand text-[13px] font-medium text-white transition hover:bg-brand-deep">Accept</button>
              <button type="button" onClick={() => decide("declined")} className="h-10 flex-1 rounded-full border border-ink/10 bg-white text-[13px] font-medium text-ink transition hover:border-ink/30">Decline</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

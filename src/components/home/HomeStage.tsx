"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "framer-motion";
import { IntroVideo } from "./IntroVideo";
import { Hero, type HeroProps } from "./Hero";

type Props = HeroProps & { introEnabled: boolean; videoSrc: string; videoPoster?: string; logo: string; brandName: string };

const KEY = "mrh_intro_seen";

/**
 * External stores read with useSyncExternalStore — React's hydration-safe way to
 * read browser-only state (sessionStorage / media queries). The server snapshot
 * matches SSR output exactly, and React re-renders with the client snapshot after
 * hydration without a mismatch error. sessionStorage can therefore never trap the
 * user in a blank/frozen state: a "seen" value simply skips the intro.
 */
const reducedMotionStore = {
  subscribe(cb: () => void) {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  },
  getSnapshot() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },
  getServerSnapshot() {
    return false;
  },
};

const seenStore = {
  listeners: new Set<() => void>(),
  notify() {
    for (const l of seenStore.listeners) l();
  },
  markSeen() {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    seenStore.notify();
  },
  subscribe(cb: () => void) {
    seenStore.listeners.add(cb);
    return () => { seenStore.listeners.delete(cb); };
  },
  getSnapshot() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
  },
  getServerSnapshot() {
    return true; // SSR + hydration: behave as if seen; re-check after mount.
  },
};

export function HomeStage({ introEnabled, videoSrc, videoPoster, logo, brandName, ...hero }: Props) {
  const reduced = useSyncExternalStore(reducedMotionStore.subscribe, reducedMotionStore.getSnapshot, reducedMotionStore.getServerSnapshot);
  const seen = useSyncExternalStore(seenStore.subscribe, seenStore.getSnapshot, seenStore.getServerSnapshot);
  const [finished, setFinished] = useState(false);

  const done = useCallback(() => {
    seenStore.markSeen();
    setFinished(true); // always terminate, even if sessionStorage is unavailable
  }, []);
  // `finished` covers skip/ended/error paths; `seen` keeps the store in sync for later mounts.
  const phase: "video" | "done" = introEnabled && videoSrc && !reduced && !seen && !finished ? "video" : "done";

  return (
    <>
      <AnimatePresence>{phase === "video" && <IntroVideo key="intro" src={videoSrc} poster={videoPoster} logo={logo} brandName={brandName} onDone={done} />}</AnimatePresence>
      <Hero {...hero} play={phase === "done"} cinematicEntry={phase !== "video"} />
    </>
  );
}

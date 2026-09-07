"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

type Props = { src: string; poster?: string; logo: string; brandName: string; onDone: () => void };

const ORIGINAL_FALLBACK = "https://res.cloudinary.com/j6kdg6uv/video/upload/v1788578370/upscaled-video.mp4";

/**
 * Full-screen silent intro. Autoplays muted/inline, no controls. Skippable.
 * Falls back to the hero immediately if autoplay is blocked, the asset fails, or reduced-motion is set.
 */
export function IntroVideo({ src, poster, logo, brandName, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [source, setSource] = useState(src);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => finish()); // autoplay blocked → straight to hero
    }
    // Safety: never trap the user. Hard cap the intro length.
    const cap = window.setTimeout(finish, 22000);
    // If nothing has started playing within 6s (slow network), skip.
    const stall = window.setTimeout(() => { if (v.readyState < 2) finish(); }, 6000);
    return () => { window.clearTimeout(cap); window.clearTimeout(stall); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const onError = () => {
    if (!triedFallback && source !== ORIGINAL_FALLBACK) {
      setTriedFallback(true);
      setSource(ORIGINAL_FALLBACK);
    } else finish();
  };

  return (
    <motion.div
      key="intro"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#05080c]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: "blur(10px)", transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } }}
      aria-label={`${brandName} intro`}
    >
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-ivory">
          <div className="relative h-14 w-[220px]"><Image src={logo} alt={brandName} fill priority className="object-contain" sizes="220px" unoptimized={logo.endsWith(".svg")} /></div>
          <div className="h-[2px] w-40 overflow-hidden rounded-full bg-ink/10"><div className="h-full w-1/2 animate-[shimmer_1.2s_linear_infinite] bg-brand" style={{ backgroundSize: "200% 100%" }} /></div>
        </div>
      )}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={source}
        poster={poster}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controls={false}
        onCanPlay={() => setReady(true)}
        onPlaying={() => setReady(true)}
        onEnded={finish}
        onError={onError}
        tabIndex={-1}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(5,8,12,0.55),transparent_60%)]" />
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 right-6 z-10 flex h-11 items-center gap-2 rounded-full border border-white/25 bg-black/30 px-5 text-[13px] font-medium tracking-wide text-white backdrop-blur-md transition hover:border-white/60 hover:bg-black/45 focus-visible:outline-white sm:bottom-10 sm:right-10"
      >
        Skip to Website
        <span aria-hidden>→</span>
      </button>
    </motion.div>
  );
}

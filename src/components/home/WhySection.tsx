"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PageSection } from "@/db/schema";
import { DynamicIcon } from "@/components/site/Icons";
import { Button3D } from "@/components/ui/Button3D";
import { Reveal } from "@/components/site/Reveal";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

function TiltCard({ icon, title, description, index }: { icon?: string; title?: string; description?: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 20 }), sy = useSpring(my, { stiffness: 200, damping: 20 });
  const rx = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const ry = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["20%", "80%"]);

  return (
    <motion.div
      ref={ref}
      data-why-card
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="card-3d group relative flex h-full flex-col items-center rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#ffffff,#f3f3ee)] px-6 pb-8 pt-10 text-center shadow-card"
    >
      <motion.div style={{ left: glowX, top: glowY }} className="pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center" style={{ transform: "translateZ(40px)" }}>
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,#ffffff,#e9efe8)] shadow-[0_18px_30px_-16px_rgba(17,20,17,0.35),inset_0_1px_0_#fff]" />
        <div className="absolute inset-2 rounded-full bg-[linear-gradient(160deg,var(--brand-bright),var(--brand))] shadow-[inset_0_2px_6px_rgba(255,255,255,0.35),0_10px_20px_-8px_rgba(31,143,58,0.7)]" />
        <DynamicIcon name={icon} className="relative h-9 w-9 text-white drop-shadow" strokeWidth={1.8} />
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight text-ink" style={{ transform: "translateZ(24px)" }}>{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-charcoal/75" style={{ transform: "translateZ(16px)" }}>{description}</p>
      <div className="absolute inset-x-8 -bottom-3 h-3 rounded-b-full bg-ink/5 blur-sm" aria-hidden />
      <span className="sr-only">Feature {index + 1}</span>
    </motion.div>
  );
}

export function WhySection({ section }: { section: PageSection }) {
  const root = useRef<HTMLElement>(null);
  const items = section.items ?? [];

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-why-card]");
      cards.forEach((c, i) => {
        gsap.fromTo(c, { y: 90 + i * 30, rotateX: 18, opacity: 0 }, { y: 0, rotateX: 0, opacity: 1, ease: "expo.out", duration: 1.3, scrollTrigger: { trigger: el, start: "top 75%", once: true }, delay: i * 0.08 });
        gsap.to(c, { y: (i % 2 === 0 ? -1 : 1) * 18, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.2 } });
      });
      gsap.to("[data-why-stage]", { xPercent: -6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="why" className="relative overflow-hidden py-24 lg:py-32" aria-labelledby="why-title">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">{section.eyebrow || "Why Mr.Home"}</p>
          <h2 id="why-title" className="display mt-4 text-[clamp(2rem,4vw,3.2rem)] text-ink">{section.title}</h2>
          {section.subtitle && <p className="mt-3 text-[clamp(1.25rem,2vw,1.6rem)] font-medium tracking-tight text-charcoal">{section.subtitle.split(" ").slice(0, -1).join(" ")} <span className="text-brand">{section.subtitle.split(" ").slice(-1)}</span></p>}
          {section.body && <p className="mt-5 max-w-sm text-[15.5px] leading-relaxed text-charcoal/80">{section.body}</p>}
          {section.ctaLabel && section.ctaHref && <div className="mt-8"><Button3D href={section.ctaHref} variant="primary">{section.ctaLabel}</Button3D></div>}
        </Reveal>
        <div className="perspective lg:col-span-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((it, i) => (
              <TiltCard key={i} index={i} icon={it.icon} title={it.title} description={it.description} />
            ))}
          </div>
          <div data-why-stage className="mx-auto mt-6 h-6 w-[92%] rounded-[100%] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(17,20,17,0.14),transparent)] blur-md" aria-hidden />
        </div>
      </div>
    </section>
  );
}

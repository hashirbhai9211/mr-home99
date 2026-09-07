"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: ReactNode;
  className?: string;
  /** Selector for children to stagger; if omitted, the wrapper itself animates. */
  stagger?: string;
  y?: number;
  as?: "div" | "section" | "ul" | "li" | "span";
  delay?: number;
};

/** GSAP + ScrollTrigger reveal with depth (translate/scale/blur) — respects reduced motion. */
export function Reveal({ children, className, stagger, y = 40, as = "div", delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = stagger ? Array.from(el.querySelectorAll(stagger)) : [el];
    if (!targets.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { y, opacity: 0, filter: "blur(6px)", scale: 0.985 },
        { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.1, ease: "expo.out", stagger: stagger ? 0.09 : 0, delay, scrollTrigger: { trigger: el, start: "top 85%", once: true } },
      );
    }, el);
    return () => ctx.revert();
  }, [stagger, y, delay]);
  const Tag = as as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}

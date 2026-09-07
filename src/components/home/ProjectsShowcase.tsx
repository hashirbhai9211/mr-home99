"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PageSection } from "@/db/schema";
import type { ProjectWithMarket } from "@/lib/content";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Button3D } from "@/components/ui/Button3D";
import { Reveal } from "@/components/site/Reveal";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function ProjectsShowcase({ section, projects }: { section: PageSection; projects: ProjectWithMarket[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current, tr = track.current;
    if (!el || !tr) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const getDist = () => Math.max(0, tr.scrollWidth - el.clientWidth + 96);
      const tween = gsap.to(tr, {
        x: () => -getDist(),
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => `+=${getDist()}`, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
      });
      const cards = gsap.utils.toArray<HTMLElement>("[data-show-card]");
      cards.forEach((c) => {
        gsap.fromTo(c, { rotateY: 14, scale: 0.92, opacity: 0.55 }, { rotateY: -6, scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tween, start: "left 95%", end: "left 35%", scrub: true } });
      });
      return () => { tween.scrollTrigger?.kill(); tween.kill(); };
    });
    mm.add("(max-width: 1023px), (pointer: coarse), (prefers-reduced-motion: reduce)", () => {
      gsap.set(tr, { clearProps: "all" });
      gsap.fromTo("[data-show-card]", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%", once: true } });
    });
    return () => mm.revert();
  }, [projects.length]);

  return (
    <section ref={root} id="projects" className="relative isolate overflow-hidden bg-space py-20 text-white lg:h-[100svh] lg:py-0" aria-labelledby="projects-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_80%,rgba(31,143,58,0.14),transparent_70%)]" />
      <div className="relative flex h-full flex-col justify-center">
        <Reveal className="mx-auto mb-8 flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:mb-10">
          <div>
            <p className="eyebrow !text-brand-bright">{section.eyebrow || "Portfolio"}</p>
            <h2 id="projects-title" className="display mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] uppercase">{section.title}</h2>
            {section.body && <p className="mt-3 max-w-md text-[14.5px] text-white/60">{section.body}</p>}
          </div>
          {section.ctaLabel && section.ctaHref && <Button3D href={section.ctaHref} variant="secondary" size="sm" className="!bg-white/10 !text-white !border-white/15 hover:!border-brand-bright/60">{section.ctaLabel}</Button3D>}
        </Reveal>

        {projects.length === 0 ? (
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6"><div className="glass-dark rounded-3xl p-12 text-center text-white/60">No published projects yet. Check back soon.</div></div>
        ) : (
          <div className="perspective w-full overflow-hidden lg:overflow-visible">
            <div ref={track} className="mx-auto grid max-w-[1400px] gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:flex lg:max-w-none lg:pl-[max(1.5rem,calc((100vw-1400px)/2+1.5rem))] lg:pr-24">
              {projects.map((p, i) => (
                <div key={p.id} data-show-card className="card-3d lg:w-[360px] lg:shrink-0 xl:w-[400px]">
                  <ProjectCard project={p} dark priority={i < 2} />
                </div>
              ))}
              <div className="hidden lg:flex lg:w-[300px] lg:shrink-0 lg:items-center lg:justify-center">
                <Button3D href={section.ctaHref || "/projects"} variant="primary" size="lg">{section.ctaLabel || "View All Projects"}</Button3D>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

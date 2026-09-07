"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base = "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium select-none whitespace-nowrap transition-[box-shadow,background-color,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "text-white bg-[linear-gradient(180deg,var(--brand-bright),var(--brand))] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_10px_24px_-10px_rgba(31,143,58,0.7),0_2px_6px_rgba(20,98,42,0.35)] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_18px_36px_-12px_rgba(31,143,58,0.8),0_0_0_4px_rgba(62,194,74,0.16)]",
  secondary: "text-ink bg-white/80 border border-ink/10 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_24px_-14px_rgba(17,20,17,0.4)] hover:border-brand/40 hover:shadow-[0_14px_30px_-14px_rgba(17,20,17,0.4),0_0_0_4px_rgba(62,194,74,0.12)] backdrop-blur",
  dark: "text-white bg-ink shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] hover:bg-charcoal",
  ghost: "text-ink hover:text-brand",
  whatsapp: "text-white bg-[linear-gradient(180deg,#31c85a,#1fa64a)] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_10px_24px_-10px_rgba(31,166,74,0.7)] hover:shadow-[0_18px_36px_-12px_rgba(31,166,74,0.8),0_0_0_4px_rgba(49,200,90,0.16)]",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[13px]",
  md: "h-12 px-6 text-[14px]",
  lg: "h-14 px-8 text-[15px]",
};

const spring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.6 };

type Common = {
  variant?: Variant;
  size?: Size;
  icon?: "arrow" | "whatsapp" | "phone" | "none";
  className?: string;
  children: ReactNode;
};

type ButtonProps = Common & Omit<HTMLMotionProps<"button">, "children"> & { href?: undefined };
type LinkProps = Common & { href: string; external?: boolean; ariaLabel?: string };

function Icon({ icon }: { icon: Common["icon"] }) {
  if (icon === "none") return null;
  if (icon === "whatsapp") return <MessageCircle className="h-4 w-4" aria-hidden />;
  if (icon === "phone") return <Phone className="h-4 w-4" aria-hidden />;
  return (
    <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20 group-[.is-secondary]:bg-ink/5 group-[.is-secondary]:ring-ink/10" aria-hidden>
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-[140%]" />
      <ArrowRight className="absolute h-3.5 w-3.5 -translate-x-[140%] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0" />
    </span>
  );
}

export function Button3D(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", icon = "arrow", className, children } = props;
  const cls = cn(base, variants[variant], sizes[size], variant === "secondary" && "is-secondary", className);
  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <Icon icon={icon} />
    </>
  );
  if ("href" in props && props.href) {
    const { href, external, ariaLabel } = props;
    const motionProps = { whileHover: { y: -2 }, whileTap: { scale: 0.97, y: 0 }, transition: spring };
    if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
      return (
        <motion.a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className={cls} aria-label={ariaLabel} {...motionProps}>
          {content}
        </motion.a>
      );
    }
    return (
      <motion.div className="inline-flex" {...motionProps}>
        <Link href={href} className={cls} aria-label={ariaLabel}>
          {content}
        </Link>
      </motion.div>
    );
  }
  const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, ...rest } = props as ButtonProps;
  void _v; void _s; void _i; void _c; void _ch;
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97, y: 0 }} transition={spring} className={cls} {...rest}>
      {content}
    </motion.button>
  );
}

import { Globe2, Building2, Users, BarChart3, ShieldCheck, MapPin, TrendingUp, Handshake, Star, Home, KeyRound, Sparkles, type LucideProps } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const svgBase = (props: SVGProps<SVGSVGElement>) => ({ viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, ...props });
const Facebook = (p: LucideProps) => <svg {...svgBase(p as SVGProps<SVGSVGElement>)}><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4V14h2.8v8h3.3Z" /></svg>;
const Instagram = (p: LucideProps) => <svg {...svgBase(p as SVGProps<SVGSVGElement>)}><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.8c2.7 0 3 0 4 .1 2.8.1 4 1.4 4.1 4.1.1 1 .1 1.4.1 4s0 3-.1 4c-.1 2.7-1.4 4-4.1 4.1-1 .1-1.4.1-4 .1s-3 0-4-.1c-2.8-.1-4-1.4-4.1-4.1-.1-1-.1-1.4-.1-4s0-3 .1-4c.1-2.7 1.4-4 4.1-4.1 1-.1 1.3-.1 4-.1ZM12 2C9.3 2 8.9 2 7.9 2.1 4.2 2.2 2.2 4.3 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.2 3.6 2.2 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.2 5.7-2.2 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.2-3.6-2.2-5.7-5.8-5.8C15.1 2 14.7 2 12 2Z" /></svg>;
const Linkedin = (p: LucideProps) => <svg {...svgBase(p as SVGProps<SVGSVGElement>)}><path d="M20.4 20.4h-3.5v-5.5c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.6H9.4V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.4v6.3ZM5.3 7.4a2 2 0 1 1 0-4.1 2 2 0 0 1 0 4.1Zm1.8 13H3.6V9h3.5v11.4Z" /></svg>;
const Youtube = (p: LucideProps) => <svg {...svgBase(p as SVGProps<SVGSVGElement>)}><path d="M23 7.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C16.5 3.7 12 3.7 12 3.7s-4.5 0-7.8.2c-.5.1-1.5.1-2.3 1C1.2 5.6 1 7.2 1 7.2S.8 9.1.8 11v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.6 1 1.9.2 7.5.2 7.5.2s4.5 0 7.8-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8ZM9.7 15V8.4l6.1 3.3L9.7 15Z" /></svg>;
const Twitter = (p: LucideProps) => <svg {...svgBase(p as SVGProps<SVGSVGElement>)}><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" /></svg>;

const MAP: Record<string, ComponentType<LucideProps>> = {
  globe: Globe2,
  building: Building2,
  users: Users,
  chart: BarChart3,
  shield: ShieldCheck,
  "shield-check": ShieldCheck,
  "map-pin": MapPin,
  "trending-up": TrendingUp,
  handshake: Handshake,
  star: Star,
  home: Home,
  key: KeyRound,
  sparkles: Sparkles,
};

export function DynamicIcon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Cmp = (name && MAP[name]) || Sparkles;
  return <Cmp {...props} />;
}

const SOCIAL: Record<string, ComponentType<LucideProps>> = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, youtube: Youtube, twitter: Twitter, x: Twitter };

export function SocialIcon({ platform, ...props }: { platform: string } & LucideProps) {
  const Cmp = SOCIAL[platform.toLowerCase()] || Globe2;
  return <Cmp {...props} />;
}

export const ICON_NAMES = Object.keys(MAP);

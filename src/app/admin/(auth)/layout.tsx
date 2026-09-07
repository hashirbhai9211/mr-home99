import type { Metadata } from "next";
import Image from "next/image";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Admin Sign In", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-space lg:block">
        <Image src="/images/hero-villa.jpg" alt="" fill className="object-cover opacity-60" sizes="50vw" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,12,0.2),rgba(5,8,12,0.85))]" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="relative h-12 w-[200px]"><Image src={s.logoDark} alt={s.brandName} fill className="object-contain object-left" unoptimized={s.logoDark.endsWith(".svg")} /></div>
          <p className="mt-6 max-w-md text-[28px] font-semibold leading-tight tracking-tight">{s.tagline}</p>
          <p className="mt-3 max-w-md text-[14px] text-white/60">Control centre for the {s.brandName} website, CRM and content.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#f4f5f3] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="relative mx-auto mb-8 h-10 w-[160px] lg:hidden"><Image src={s.logo} alt={s.brandName} fill className="object-contain" unoptimized={s.logo.endsWith(".svg")} /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

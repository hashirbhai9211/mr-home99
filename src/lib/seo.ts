import "server-only";
import type { Metadata } from "next";
import { getSeoEntry, getSettings } from "./content";

export async function buildMetadata(path: string, fallback: { title: string; description?: string | null; image?: string | null; noIndex?: boolean } ): Promise<Metadata> {
  const [s, entry] = await Promise.all([getSettings(), getSeoEntry(path)]);
  const title = entry?.title || fallback.title;
  const description = entry?.description || fallback.description || s.seoDefaultDescription;
  const image = entry?.ogImage || fallback.image || s.seoOgImage;
  const noIndex = entry?.noIndex || fallback.noIndex || false;
  return {
    title: { absolute: title.includes(s.brandName) ? title : `${title} | ${s.brandName}` },
    description,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title, description, url: path, images: image ? [{ url: image }] : undefined, type: "website", siteName: s.brandName },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export function absoluteUrl(base: string, path: string) {
  try { return new URL(path, base || "http://localhost:3000").toString(); } catch { return path; }
}

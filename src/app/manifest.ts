import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: s.brandName,
    short_name: s.brandName,
    description: s.seoDefaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: s.primaryColor,
    icons: [{ src: s.favicon, sizes: "any", type: "image/svg+xml" }],
  };
}

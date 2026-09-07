export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatPrice(price: string | number | null | undefined, currency?: string | null) {
  if (price == null || price === "") return "Price on request";
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(n)) return "Price on request";
  const cur = currency || "USD";
  let compact: string;
  if (n >= 1_000_000) compact = `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  else if (n >= 1_000) compact = `${Math.round(n / 1_000)}K`;
  else compact = n.toLocaleString();
  return `${cur} ${compact}`;
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function sanitizeText(input: string, max = 5000) {
  return input.replace(/[<>]/g, "").trim().slice(0, max);
}

export const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  "under-construction": "Under Construction",
  ready: "Ready to Move",
  "coming-soon": "Coming Soon",
  "sold-out": "Sold Out",
};

export function statusTone(s: string): "neutral" | "green" | "amber" | "red" | "blue" | "slate" {
  switch (s) {
    case "NEW": return "blue";
    case "CONTACTED": return "amber";
    case "QUALIFIED": return "green";
    case "CONVERTED": return "slate";
    case "LOST": return "red";
    case "ARCHIVED": return "neutral";
    default: return "neutral";
  }
}

export function readingTimeSafe(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

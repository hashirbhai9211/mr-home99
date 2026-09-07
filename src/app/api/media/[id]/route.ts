import { eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import { media } from "@/db/schema";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await initDb();
  const { id } = await ctx.params;
  const numeric = parseInt(id, 10);
  if (Number.isNaN(numeric)) return new Response("Not found", { status: 404 });
  const rows = await db.select().from(media).where(eq(media.id, numeric)).limit(1);
  const m = rows[0];
  if (!m || !m.data) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": m.mimeType,
    "Content-Length": String(m.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `${m.mimeType.startsWith("image/") || m.mimeType.startsWith("video/") || m.mimeType === "application/pdf" ? "inline" : "attachment"}; filename="${m.filename.replace(/"/g, "")}"`,
  };
  if (m.mimeType === "image/svg+xml") headers["Content-Security-Policy"] = "sandbox; script-src 'none'";
  return new Response(new Uint8Array(m.data), { headers });
}

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { getIp, handle, json, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Please enter a valid email"), website: z.string().max(0).optional() });

export const POST = handle(async (req) => {
  const ip = getIp(req);
  const rl = rateLimit(`news:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) return json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const body = await readJson<Record<string, unknown>>(req);
  if (typeof body.website === "string" && body.website) return json({ ok: true, message: "Subscribed." });
  const { email } = schema.parse(body);
  const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  if (existing[0]) {
    if (existing[0].unsubscribedAt) await db.update(newsletterSubscribers).set({ unsubscribedAt: null }).where(eq(newsletterSubscribers.id, existing[0].id));
    return json({ ok: true, message: "You're already subscribed." });
  }
  await db.insert(newsletterSubscribers).values({ email, source: req.headers.get("referer") ?? "website" });
  return json({ ok: true, message: "Subscribed — welcome to MR.HOME insights." }, { status: 201 });
});

import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hasAnyUsers, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getIp, handle, json, readJson } from "@/lib/api";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "ceo@mrhome.com";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  password: z.string().min(12, "Use at least 12 characters").max(200).regex(/[A-Z]/, "Include an uppercase letter").regex(/[a-z]/, "Include a lowercase letter").regex(/[0-9]/, "Include a number"),
  confirm: z.string(),
  setupToken: z.string().optional(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export const GET = handle(async () => {
  const exists = await hasAnyUsers();
  return json({ needsSetup: !exists, email: ADMIN_EMAIL, requiresToken: !!process.env.ADMIN_SETUP_TOKEN });
});

export const POST = handle(async (req) => {
  const ip = getIp(req);
  if (!rateLimit(`setup:${ip}`, 5, 15 * 60 * 1000).ok) return json({ error: "Too many attempts" }, { status: 429 });
  if (await hasAnyUsers()) return json({ error: "Setup has already been completed." }, { status: 409 });
  const data = schema.parse(await readJson(req));
  if (process.env.ADMIN_SETUP_TOKEN && data.setupToken !== process.env.ADMIN_SETUP_TOKEN) return json({ error: "Invalid setup token" }, { status: 403 });

  const passwordHash = await hashPassword(data.password);
  const [user] = await db.insert(users).values({ email: ADMIN_EMAIL, name: data.name, passwordHash, role: "SUPER_ADMIN", active: true, lastLoginAt: new Date() }).returning();
  const { token, expiresAt } = await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  await audit({ user: { ...user }, action: "auth.setup", entity: "user", entityId: user.id, ip });
  return json({ ok: true, redirect: "/admin" }, { status: 201 });
});

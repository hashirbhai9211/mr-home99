import { z } from "zod";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroyAllUserSessions, hashPassword, requireUser, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { getIp, handle, json, readJson } from "@/lib/api";
import { audit } from "@/lib/audit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, "Use at least 12 characters").max(200).regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number"),
  name: z.string().trim().min(2).max(120).optional(),
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  const data = schema.parse(await readJson(req));
  const [row] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!row || !(await verifyPassword(data.currentPassword, row.passwordHash))) return json({ error: "Current password is incorrect" }, { status: 400 });
  await db.update(users).set({ passwordHash: await hashPassword(data.newPassword), name: data.name ?? row.name, updatedAt: new Date() }).where(eq(users.id, me.id));
  // Invalidate every other session and issue a fresh one.
  await destroyAllUserSessions(me.id);
  const ip = getIp(req);
  const { token, expiresAt } = await createSession(me.id, { ip, userAgent: req.headers.get("user-agent") });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  await audit({ user: me, action: "auth.password_changed", entity: "user", entityId: me.id, ip });
  return json({ ok: true });
});

const profileSchema = z.object({ name: z.string().trim().min(2).max(120) });
export const PATCH = handle(async (req) => {
  const me = await requireUser();
  const data = profileSchema.parse(await readJson(req));
  await db.update(users).set({ name: data.name, updatedAt: new Date() }).where(eq(users.id, me.id));
  await audit({ user: me, action: "user.profile_updated", entity: "user", entityId: me.id, ip: getIp(req) });
  return json({ ok: true });
});

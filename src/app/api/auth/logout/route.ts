import { cookies } from "next/headers";
import { destroySession, getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { getIp, handle, json } from "@/lib/api";
import { audit } from "@/lib/audit";

export const POST = handle(async (req) => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const user = await getCurrentUser();
  if (token) await destroySession(token);
  store.set(SESSION_COOKIE, "", { ...{ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" }, maxAge: 0 });
  if (user) await audit({ user, action: "auth.logout", entity: "user", entityId: user.id, ip: getIp(req) });
  return json({ ok: true });
});

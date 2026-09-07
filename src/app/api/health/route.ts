import { db, getActiveDriver, initDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, driver: getActiveDriver() });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

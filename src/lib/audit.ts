import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { SafeUser } from "./auth";

export async function audit(opts: {
  user?: SafeUser | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: opts.user?.id ?? null,
      userEmail: opts.user?.email ?? null,
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId != null ? String(opts.entityId) : null,
      metadata: opts.metadata ?? null,
      ip: opts.ip ?? null,
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, markets, projects, users } from "@/db/schema";
import { getIp, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

function csv(v: unknown) {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET = handle(async (req) => {
  const me = await requireUser("leads.export");
  const rows = await db
    .select({ id: leads.id, name: leads.name, email: leads.email, phone: leads.phone, whatsapp: leads.whatsapp, country: leads.country, market: markets.name, project: projects.name, budget: leads.budget, interest: leads.interest, message: leads.message, source: leads.source, page: leads.page, campaign: leads.campaign, status: leads.status, assignedTo: users.name, archived: leads.archived, createdAt: leads.createdAt, updatedAt: leads.updatedAt })
    .from(leads)
    .leftJoin(markets, eq(leads.marketId, markets.id))
    .leftJoin(projects, eq(leads.projectId, projects.id))
    .leftJoin(users, eq(leads.assignedTo, users.id))
    .orderBy(desc(leads.createdAt));
  const headers = Object.keys(rows[0] ?? { id: "", name: "", email: "" });
  const body = [headers.join(","), ...rows.map((r) => headers.map((h) => csv((r as Record<string, unknown>)[h])).join(","))].join("\n");
  await audit({ user: me, action: "lead.exported", entity: "leads", metadata: { count: rows.length }, ip: getIp(req) });
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mrhome-leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
});

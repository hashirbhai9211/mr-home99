import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leadActivities, leadNotes, leadTasks, leads } from "@/db/schema";
import { ApiError, getIp, handle, json, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };
const idOf = async (ctx: Ctx) => { const n = parseInt((await ctx.params).id, 10); if (Number.isNaN(n)) throw new ApiError(400, "Invalid id"); return n; };

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("note"), content: z.string().trim().min(1).max(5000) }),
  z.object({ type: z.literal("task"), title: z.string().trim().min(1).max(300), dueAt: z.string().datetime().optional().nullable(), assignedTo: z.number().int().optional().nullable() }),
  z.object({ type: z.literal("task_toggle"), taskId: z.number().int(), done: z.boolean() }),
  z.object({ type: z.literal("task_delete"), taskId: z.number().int() }),
  z.object({ type: z.literal("contact"), channel: z.enum(["email", "whatsapp", "phone"]), note: z.string().max(1000).optional() }),
]);

export const GET = handle<Ctx>(async (_req, ctx) => {
  await requireUser("leads.read");
  const id = await idOf(ctx);
  const [notes, tasks, activities] = await Promise.all([
    db.select().from(leadNotes).where(eq(leadNotes.leadId, id)).orderBy(desc(leadNotes.createdAt)),
    db.select().from(leadTasks).where(eq(leadTasks.leadId, id)).orderBy(desc(leadTasks.createdAt)),
    db.select().from(leadActivities).where(eq(leadActivities.leadId, id)).orderBy(desc(leadActivities.createdAt)),
  ]);
  return json({ notes, tasks, activities });
});

export const POST = handle<Ctx>(async (req, ctx) => {
  const me = await requireUser("leads.write");
  const id = await idOf(ctx);
  const [lead] = await db.select({ id: leads.id, status: leads.status }).from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) throw new ApiError(404, "Lead not found");
  const body = schema.parse(await readJson(req));
  const touch = () => db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, id));

  switch (body.type) {
    case "note":
      await db.insert(leadNotes).values({ leadId: id, userId: me.id, userName: me.name, content: body.content });
      await db.insert(leadActivities).values({ leadId: id, userId: me.id, userName: me.name, type: "note", description: "Note added" });
      break;
    case "task":
      await db.insert(leadTasks).values({ leadId: id, title: body.title, dueAt: body.dueAt ? new Date(body.dueAt) : null, assignedTo: body.assignedTo ?? me.id });
      await db.insert(leadActivities).values({ leadId: id, userId: me.id, userName: me.name, type: "task", description: `Follow-up scheduled: ${body.title}` });
      break;
    case "task_toggle":
      await db.update(leadTasks).set({ done: body.done }).where(eq(leadTasks.id, body.taskId));
      await db.insert(leadActivities).values({ leadId: id, userId: me.id, userName: me.name, type: "task", description: body.done ? "Task completed" : "Task reopened" });
      break;
    case "task_delete":
      await db.delete(leadTasks).where(eq(leadTasks.id, body.taskId));
      break;
    case "contact":
      await db.insert(leadActivities).values({ leadId: id, userId: me.id, userName: me.name, type: body.channel, description: `Contacted via ${body.channel}${body.note ? `: ${body.note}` : ""}` });
      if (lead.status === "NEW") {
        await db.update(leads).set({ status: "CONTACTED" }).where(eq(leads.id, id));
        await db.insert(leadActivities).values({ leadId: id, userId: me.id, userName: me.name, type: "status", description: "Status changed NEW → CONTACTED" });
      }
      break;
  }
  await touch();
  await audit({ user: me, action: `lead.${body.type}`, entity: "leads", entityId: id, ip: getIp(req) });
  return json({ ok: true });
});

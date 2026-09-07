import "server-only";
import { z, type ZodTypeAny } from "zod";
import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { auditLogs, cities, faqs, leads, legalPages, markets, navigationItems, newsletterSubscribers, pageSections, projects, seoEntries, testimonials, users, whatsappTemplates } from "@/db/schema";
import { RESOURCES, type FieldDef, type ResourceDef } from "./resources";
import { slugify } from "./utils";

export const RESOURCE_TABLES: Record<string, PgTable> = {
  projects, markets, cities, sections: pageSections, navigation: navigationItems, legal: legalPages, faqs, testimonials, whatsapp: whatsappTemplates, seo: seoEntries, users, newsletter: newsletterSubscribers, audit: auditLogs, leads,
};

export function getResource(key: string): { def: ResourceDef; table: PgTable } | null {
  const def = RESOURCES[key];
  const table = RESOURCE_TABLES[key];
  if (!def || !table) return null;
  return { def, table };
}

export function columnsOf(table: PgTable) {
  return getTableColumns(table) as Record<string, import("drizzle-orm").Column>;
}

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

function fieldSchema(f: FieldDef): ZodTypeAny {
  const max = f.max ?? (f.type === "textarea" ? 20000 : 500);
  switch (f.type) {
    case "text":
    case "textarea":
    case "image":
    case "color":
      return f.required ? z.string().trim().min(1, `${f.label} is required`).max(max) : z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
    case "slug":
      return z.string().trim().min(1, `${f.label} is required`).max(120).transform((s) => slugify(s));
    case "email":
      return z.string().trim().toLowerCase().email("Invalid email").max(254);
    case "password":
      return z.preprocess(emptyToNull, z.string().min(10, "Password must be at least 10 characters").max(200).nullable().optional());
    case "number":
      return z.preprocess(emptyToNull, z.coerce.number().nullable().optional()).transform((v) => (v == null ? null : v));
    case "relation":
      return z.preprocess(emptyToNull, z.coerce.number().int().nullable().optional()).transform((v) => (v == null ? null : v));
    case "boolean":
      return z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean().optional());
    case "select":
      return f.required ? z.string().min(1, `${f.label} is required`) : z.preprocess(emptyToNull, z.string().nullable().optional());
    case "tags":
      return z.preprocess((v) => (typeof v === "string" ? v.split("\n").map((s) => s.trim()).filter(Boolean) : v ?? []), z.array(z.string().max(1000)).max(200));
    case "json":
      return z.preprocess((v) => { if (typeof v === "string") { try { return JSON.parse(v); } catch { return v; } } return v ?? []; }, z.array(z.record(z.string(), z.any())).max(200));
    case "datetime":
      return z.preprocess(emptyToNull, z.coerce.date().nullable().optional());
    default:
      return z.any();
  }
}

export function buildSchema(def: ResourceDef, partial = false) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const f of def.fields) {
    if (f.readOnly) continue;
    shape[f.name] = partial ? fieldSchema(f).optional() : fieldSchema(f);
  }
  return z.object(shape).strip();
}

/** Coerce validated values into column-compatible values (e.g. numeric columns expect strings). */
export function toRow(table: PgTable, data: Record<string, unknown>) {
  const cols = columnsOf(table);
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const col = cols[k];
    if (!col) continue;
    // Omit null values for NOT NULL columns that have a database default
    // (e.g. "order") so PostgreSQL applies the default instead of erroring.
    if (v == null && col.notNull && col.hasDefault) continue;
    if (col.dataType === "string" && typeof v === "number") row[k] = String(v);
    else if (col.dataType === "number" && typeof v === "string") row[k] = v === "" ? null : Number(v);
    else row[k] = v;
  }
  if (cols.updatedAt) row.updatedAt = new Date();
  return row;
}

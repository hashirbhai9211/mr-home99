import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, initDb } from "@/db";
import { cities, faqs, legalPages, markets, navigationItems, pageSections, projects, seoEntries, siteSettings, testimonials, type City, type Market, type Project } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { mergeSettings, type SiteSettings } from "./settings-types";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    await initDb();
    await ensureSeeded();
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    return mergeSettings(rows[0]?.data);
  } catch (e) {
    console.error("[settings]", e);
    return mergeSettings(null);
  }
});

export const getNavigation = cache(async (location: "header" | "footer") => {
  await ensureSeeded();
  return db.select().from(navigationItems).where(and(eq(navigationItems.location, location), eq(navigationItems.visible, true))).orderBy(asc(navigationItems.order));
});

export const getSections = cache(async (page: string) => {
  await ensureSeeded();
  return db.select().from(pageSections).where(and(eq(pageSections.page, page), eq(pageSections.enabled, true))).orderBy(asc(pageSections.order));
});

export const getPublishedMarkets = cache(async (): Promise<Market[]> => {
  await ensureSeeded();
  return db.select().from(markets).where(eq(markets.published, true)).orderBy(asc(markets.order), asc(markets.name));
});

export const getMarketBySlug = cache(async (slug: string, includeDrafts = false) => {
  await initDb(); // guarantee initialisation even when called concurrently
  const where = includeDrafts ? eq(markets.slug, slug) : and(eq(markets.slug, slug), eq(markets.published, true));
  const rows = await db.select().from(markets).where(where).limit(1);
  return rows[0] ?? null;
});

export const getCitiesByMarket = cache(async (marketId: number): Promise<City[]> => {
  await initDb();
  return db
    .select()
    .from(cities)
    .where(and(eq(cities.marketId, marketId), eq(cities.published, true)))
    .orderBy(desc(cities.featured), asc(cities.order), asc(cities.name));
});

export const getCityBySlug = cache(async (marketId: number, slug: string): Promise<City | null> => {
  await initDb();
  const rows = await db
    .select()
    .from(cities)
    .where(and(eq(cities.marketId, marketId), eq(cities.slug, slug), eq(cities.published, true)))
    .limit(1);
  return rows[0] ?? null;
});

export type ProjectWithMarket = Project & { market: Pick<Market, "id" | "name" | "slug" | "flag" | "countryCode"> | null };

const projectSelect = {
  project: projects,
  market: { id: markets.id, name: markets.name, slug: markets.slug, flag: markets.flag, countryCode: markets.countryCode },
};

function mapRows(rows: { project: Project; market: { id: number; name: string; slug: string; flag: string; countryCode: string } | null }[]): ProjectWithMarket[] {
  return rows.map((r) => ({ ...r.project, market: r.market?.id ? r.market : null }));
}

export type ProjectFilters = { market?: string; type?: string; status?: string; q?: string; city?: string; featured?: boolean; limit?: number; excludeId?: number };

export const getPublishedMarketCities = cache(async (): Promise<Record<number, string[]>> => {
  await initDb();
  const rows = await db
    .select({ marketId: cities.marketId, name: cities.name })
    .from(cities)
    .where(eq(cities.published, true))
    .orderBy(desc(cities.featured), asc(cities.order), asc(cities.name));
  const map: Record<number, string[]> = {};
  for (const r of rows) if (r.marketId != null) (map[r.marketId] ??= []).push(r.name);
  return map;
});

export const getPublishedProjects = cache(async (filters: ProjectFilters = {}): Promise<ProjectWithMarket[]> => {
  await ensureSeeded();
  const conds: SQL[] = [eq(projects.published, true), eq(projects.archived, false)];
  if (filters.market) conds.push(eq(markets.slug, filters.market));
  if (filters.city) conds.push(eq(projects.city, filters.city));
  if (filters.type) conds.push(eq(projects.propertyType, filters.type));
  if (filters.status) conds.push(eq(projects.status, filters.status));
  if (filters.featured) conds.push(eq(projects.featured, true));
  if (filters.excludeId) conds.push(sql`${projects.id} <> ${filters.excludeId}`);
  if (filters.q) {
    const q = `%${filters.q}%`;
    conds.push(or(ilike(projects.name, q), ilike(projects.city, q), ilike(projects.developer, q), ilike(markets.name, q))!);
  }
  const query = db.select(projectSelect).from(projects).leftJoin(markets, eq(projects.marketId, markets.id)).where(and(...conds)).orderBy(desc(projects.featured), asc(projects.order), desc(projects.createdAt));
  const rows = filters.limit ? await query.limit(filters.limit) : await query;
  return mapRows(rows);
});

export const getProjectBySlug = cache(async (slug: string, includeDrafts = false): Promise<ProjectWithMarket | null> => {
  await initDb();
  const conds: SQL[] = [eq(projects.slug, slug)];
  if (!includeDrafts) conds.push(eq(projects.published, true), eq(projects.archived, false));
  const rows = await db.select(projectSelect).from(projects).leftJoin(markets, eq(projects.marketId, markets.id)).where(and(...conds)).limit(1);
  return mapRows(rows)[0] ?? null;
});

export const getProjectCountsByMarket = cache(async () => {
  await initDb();
  const rows = await db
    .select({ marketId: projects.marketId, count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(eq(projects.published, true), eq(projects.archived, false)))
    .groupBy(projects.marketId);
  const map: Record<number, number> = {};
  for (const r of rows) if (r.marketId != null) map[r.marketId] = r.count;
  return map;
});

export const getPropertyTypes = cache(async () => {
  await initDb();
  const rows = await db.selectDistinct({ t: projects.propertyType }).from(projects).where(and(eq(projects.published, true), eq(projects.archived, false)));
  return rows.map((r) => r.t).filter((t): t is string => !!t).sort();
});

export const getLegalPage = cache(async (slug: string) => {
  await initDb();
  await ensureSeeded();
  const rows = await db.select().from(legalPages).where(and(eq(legalPages.slug, slug), eq(legalPages.published, true))).limit(1);
  return rows[0] ?? null;
});

export const getPublishedLegalPages = cache(async () => {
  await initDb();
  await ensureSeeded();
  return db.select({ slug: legalPages.slug, title: legalPages.title, updatedAt: legalPages.updatedAt }).from(legalPages).where(eq(legalPages.published, true));
});

export const getFaqs = cache(async () => {
  await initDb(); // no-op after first call
  return db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.order));
});
export const getTestimonials = cache(async () => {
  await initDb(); // no-op after first call
  return db.select().from(testimonials).where(eq(testimonials.published, true)).orderBy(asc(testimonials.order));
});

export const getSeoEntry = cache(async (path: string) => {
  await initDb(); // no-op after first call
  const rows = await db.select().from(seoEntries).where(eq(seoEntries.path, path)).limit(1);
  return rows[0] ?? null;
});

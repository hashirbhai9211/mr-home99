import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  numeric,
  index,
  customType,
} from "drizzle-orm/pg-core";

export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
});

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | "ARCHIVED";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<Role>().notNull().default("EDITOR"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    userEmail: text("user_email"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_entity_idx").on(t.entity)],
);

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const navigationItems = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  location: text("location").notNull().default("header"), // header | footer
  label: text("label").notNull(),
  href: text("href").notNull(),
  order: integer("order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  parentId: integer("parent_id"),
  openInNewTab: boolean("open_in_new_tab").notNull().default(false),
});

export type SectionItem = { title?: string; description?: string; icon?: string; value?: string; label?: string; image?: string };

export const pageSections = pgTable(
  "page_sections",
  {
    id: serial("id").primaryKey(),
    page: text("page").notNull().default("home"),
    key: text("key").notNull(),
    eyebrow: text("eyebrow"),
    title: text("title"),
    subtitle: text("subtitle"),
    body: text("body"),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    secondaryCtaLabel: text("secondary_cta_label"),
    secondaryCtaHref: text("secondary_cta_href"),
    image: text("image"),
    video: text("video"),
    background: text("background"),
    items: jsonb("items").$type<SectionItem[]>().default([]),
    order: integer("order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sections_page_idx").on(t.page)],
);

export const markets = pgTable(
  "markets",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    countryCode: text("country_code").notNull(),
    flag: text("flag").notNull().default(""),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    investmentOverview: text("investment_overview"),
    stats: jsonb("stats").$type<{ label: string; value: string }[]>().default([]),
    cities: jsonb("cities").$type<string[]>().default([]),
    coverImage: text("cover_image"),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    order: integer("order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("markets_published_idx").on(t.published)],
);

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    marketId: integer("market_id").references(() => markets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    tagline: text("tagline"),
    description: text("description"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    stats: jsonb("stats").$type<{ label: string; value: string }[]>().default([]),
    coverImage: text("cover_image"),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    order: integer("order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cities_market_idx").on(t.marketId), index("cities_published_idx").on(t.published)],
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    marketId: integer("market_id").references(() => markets.id, { onDelete: "set null" }),
    country: text("country"),
    city: text("city"),
    address: text("address"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    developer: text("developer"),
    shortDescription: text("short_description"),
    description: text("description"),
    price: numeric("price"),
    currency: text("currency").default("USD"),
    roi: text("roi"),
    propertyType: text("property_type"),
    bedrooms: text("bedrooms"),
    bathrooms: text("bathrooms"),
    area: text("area"),
    handover: text("handover"),
    status: text("status").notNull().default("available"),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    order: integer("order").notNull().default(0),
    coverImage: text("cover_image"),
    gallery: jsonb("gallery").$type<string[]>().default([]),
    video: text("video"),
    floorPlans: jsonb("floor_plans").$type<{ name: string; image?: string; area?: string }[]>().default([]),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    specifications: jsonb("specifications").$type<{ label: string; value: string }[]>().default([]),
    documents: jsonb("documents").$type<{ name: string; url: string }[]>().default([]),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_market_idx").on(t.marketId),
    index("projects_published_idx").on(t.published),
    index("projects_featured_idx").on(t.featured),
  ],
);

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    kind: text("kind").notNull().default("image"), // image | video | document | logo
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
    caption: text("caption"),
    data: bytea("data"),
    uploadedBy: integer("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_kind_idx").on(t.kind)],
);

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    country: text("country"),
    marketId: integer("market_id").references(() => markets.id, { onDelete: "set null" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    city: text("city"),
    budget: text("budget"),
    interest: text("interest"),
    message: text("message"),
    source: text("source").default("website"),
    page: text("page"),
    campaign: text("campaign"),
    status: text("status").$type<LeadStatus>().notNull().default("NEW"),
    score: integer("score").notNull().default(0),
    assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
    archived: boolean("archived").notNull().default(false),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("leads_status_idx").on(t.status),
    index("leads_created_idx").on(t.createdAt),
    index("leads_email_idx").on(t.email),
    index("leads_market_idx").on(t.marketId),
  ],
);

export const leadNotes = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  userId: integer("user_id"),
  userName: text("user_name"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leadTasks = pgTable("lead_tasks", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  done: boolean("done").notNull().default(false),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    userId: integer("user_id"),
    userName: text("user_name"),
    type: text("type").notNull(), // created | status | assigned | note | task | email | whatsapp | archived | restored
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_activities_lead_idx").on(t.leadId)],
);

export const legalPages = pgTable("legal_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  published: boolean("published").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  quote: text("quote").notNull(),
  image: text("image"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  template: text("template").notNull(),
});

export const seoEntries = pgTable("seo_entries", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  title: text("title"),
  description: text("description"),
  ogImage: text("og_image"),
  noIndex: boolean("no_index").notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type Market = typeof markets.$inferSelect;
export type City = typeof cities.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type PageSection = typeof pageSections.$inferSelect;
export type NavigationItem = typeof navigationItems.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type LegalPage = typeof legalPages.$inferSelect;

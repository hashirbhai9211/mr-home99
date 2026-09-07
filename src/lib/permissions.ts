import type { Role } from "@/db/schema";

export const PERMISSIONS = [
  "users.read", "users.write",
  "settings.read", "settings.write",
  "projects.read", "projects.write", "projects.publish",
  "markets.read", "markets.write", "markets.publish",
  "content.read", "content.write",
  "media.read", "media.write",
  "leads.read", "leads.write", "leads.export",
  "seo.read", "seo.write",
  "legal.read", "legal.write",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((p) => p !== "users.write"),
  EDITOR: [
    "projects.read", "projects.write",
    "markets.read", "markets.write",
    "content.read", "content.write",
    "media.read", "media.write",
    "leads.read", "leads.write",
    "seo.read", "seo.write",
    "legal.read",
    "settings.read",
  ],
};

export const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

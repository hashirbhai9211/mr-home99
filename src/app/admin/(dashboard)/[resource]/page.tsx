import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, userCan } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const dynamic = "force-dynamic";

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = RESOURCES[resource];
  if (!def) notFound();
  const user = await getCurrentUser();
  if (!userCan(user, def.read)) redirect("/admin");
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <ResourceManager resourceKey={resource} canWrite={userCan(user, def.write)} canExport={resource === "leads" && userCan(user, "leads.export")} />
    </Suspense>
  );
}

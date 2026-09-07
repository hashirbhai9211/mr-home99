import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, userCan } from "@/lib/auth";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!userCan(user, "leads.read")) redirect("/admin");
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <ResourceManager resourceKey="leads" canWrite={userCan(user, "leads.write")} canExport={userCan(user, "leads.export")} />
    </Suspense>
  );
}

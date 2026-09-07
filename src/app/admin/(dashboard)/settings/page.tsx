import { redirect } from "next/navigation";
import { getCurrentUser, userCan } from "@/lib/auth";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!userCan(user, "settings.read")) redirect("/admin");
  return <div className="mx-auto max-w-5xl"><SettingsForm canWrite={userCan(user, "settings.write")} /></div>;
}

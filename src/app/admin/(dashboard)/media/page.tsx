import { redirect } from "next/navigation";
import { getCurrentUser, userCan } from "@/lib/auth";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await getCurrentUser();
  if (!userCan(user, "media.read")) redirect("/admin");
  return <MediaLibrary canWrite={userCan(user, "media.write")} />;
}

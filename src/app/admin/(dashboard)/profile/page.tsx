import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = (await getCurrentUser())!;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h1 className="text-[22px] font-semibold tracking-tight">My profile</h1><p className="text-[13px] text-mist">{user.email} · {user.role.replace("_", " ")} · Last login {formatDateTime(user.lastLoginAt)}</p></div>
      <ProfileForm name={user.name} />
    </div>
  );
}

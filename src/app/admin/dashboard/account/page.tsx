import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { getAdminSession } from "@/lib/auth";

export default async function AdminAccountPage() {
  const session = await getAdminSession();
  if (session?.role !== "staff") redirect("/admin/dashboard/settings");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">My Password</h1>
      <p className="mt-1 text-sm text-muted">
        Change the password for your login ({session.username}). Use a long one and keep it in a password manager.
      </p>
      <div className="mt-6">
        <ChangePasswordForm endpoint="/api/admin/account/password" />
      </div>
    </div>
  );
}

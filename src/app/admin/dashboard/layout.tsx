import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { getAdminSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <DashboardNav
        ownerAccess={session.role === "owner"}
        areas={[...session.areas]}
        signedInAs={session.role === "staff" ? session.name : undefined}
      />
      <div className="mt-8">{children}</div>
    </div>
  );
}

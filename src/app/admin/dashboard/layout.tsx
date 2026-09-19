import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <DashboardNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}

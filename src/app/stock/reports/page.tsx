import { redirect } from "next/navigation";
import ReportsView from "@/components/stock/ReportsView";
import { PageTitle } from "@/components/stock/ui";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await getAdminSession();
  if (!session || !isStockManager(session)) redirect("/stock");
  return (
    <div>
      <PageTitle title="Reports" text="Food cost in AED, top items, slow movers and wastage for any period." />
      <ReportsView />
    </div>
  );
}

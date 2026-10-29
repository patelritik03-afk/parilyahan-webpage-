import { redirect } from "next/navigation";
import PricesManager from "@/components/stock/PricesManager";
import { PageTitle } from "@/components/stock/ui";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "Prices" };

export default async function PricesPage() {
  const session = await getAdminSession();
  if (!session || !isStockManager(session)) redirect("/stock");
  return (
    <div>
      <PageTitle title="Prices" text="Price rises from supplier bills, and what you paid for each item over time." />
      <PricesManager />
    </div>
  );
}

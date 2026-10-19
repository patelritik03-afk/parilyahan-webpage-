import { redirect } from "next/navigation";
import StockImport from "@/components/stock/StockImport";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "Import / Export" };

export default async function StockImportPage() {
  const session = await getAdminSession();
  if (!session || !isStockManager(session)) redirect("/stock");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Import / Export</h1>
      <div className="mt-6">
        <StockImport />
      </div>
    </div>
  );
}

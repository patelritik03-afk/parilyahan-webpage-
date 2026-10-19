import SuppliersManager from "@/components/stock/SuppliersManager";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "Suppliers" };

export default async function StockSuppliersPage() {
  const session = await getAdminSession();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Suppliers</h1>
      <p className="mt-1 text-sm text-muted">Who you buy from. Heads and the owner can add and edit suppliers.</p>
      <div className="mt-6">
        <SuppliersManager canManage={session ? isStockManager(session) : false} />
      </div>
    </div>
  );
}

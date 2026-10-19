import ItemsManager from "@/components/stock/ItemsManager";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "Items" };

export default async function StockItemsPage({ searchParams }: PageProps<"/stock/items">) {
  const [session, params] = await Promise.all([getAdminSession(), searchParams]);
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Items</h1>
      <p className="mt-1 text-sm text-muted">
        Quantities are in each item&apos;s base unit. Red means below par level. Tap an item for details.
      </p>
      <div className="mt-6">
        <ItemsManager canManage={session ? isStockManager(session) : false} initialBelowPar={params.below === "1"} />
      </div>
    </div>
  );
}

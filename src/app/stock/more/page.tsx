import Link from "next/link";
import { StockIcon } from "@/components/stock/icons";
import { visibleNav } from "@/components/stock/nav";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "All sections" };

export default async function MorePage() {
  const session = await getAdminSession();
  const items = visibleNav(session ? isStockManager(session) : false);
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">All sections</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-center shadow-sm hover:border-primary"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <StockIcon name={item.icon} className="h-9 w-9" />
            </span>
            <span className="font-display font-semibold">{item.label}</span>
            <span className="text-xs text-muted">{item.text}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

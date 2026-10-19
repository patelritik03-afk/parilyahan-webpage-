import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StockHeader from "@/components/stock/StockHeader";
import StockNav from "@/components/stock/StockNav";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Stock", template: "%s | Stock" },
  robots: { index: false, follow: false },
};

export default async function StockLayout({ children }: LayoutProps<"/stock">) {
  const session = await getAdminSession();
  if (!session) redirect("/admin?next=/stock");
  if (session.role !== "owner" && !session.areas.includes("stock")) redirect("/admin/dashboard");

  const manager = isStockManager(session);
  const otherAreas = session.role === "owner" || session.areas.some((a) => a !== "stock");
  return (
    <div className="min-h-screen bg-background">
      <StockHeader
        name={session.name}
        roleLabel={session.level === "owner" ? "Owner" : manager ? "Head" : "Staff"}
        showAdminLink={otherAreas}
      />
      <div className="mx-auto flex max-w-6xl gap-8 px-4 pb-28 pt-6 sm:px-6 md:pb-16">
        <StockNav manager={manager} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

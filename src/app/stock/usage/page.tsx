import UsageManager from "@/components/stock/UsageManager";
import { PageTitle } from "@/components/stock/ui";
import { getAdminSession, isStockManager } from "@/lib/auth";

export const metadata = { title: "Daily usage" };

export default async function UsagePage() {
  const session = await getAdminSession();
  return (
    <div>
      <PageTitle
        title="Daily usage"
        text="What the kitchen used and what was wasted. Each entry takes the stock down."
      />
      <UsageManager manager={session ? isStockManager(session) : false} />
    </div>
  );
}

import BillDetail from "@/components/stock/BillDetail";
import { LinkButton, PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Bill" };

export default async function BillPage({ params, searchParams }: PageProps<"/stock/bills/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return (
    <div>
      <PageTitle title="Bill" action={<LinkButton href="/stock/bills" outline>All bills</LinkButton>} />
      <BillDetail id={id} saved={query.saved === "1"} alerts={Number(query.alerts) || 0} />
    </div>
  );
}

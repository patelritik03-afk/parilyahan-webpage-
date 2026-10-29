import BillForm from "@/components/stock/BillForm";
import { PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Enter a bill" };

export default async function NewBillPage({ searchParams }: PageProps<"/stock/bills/new">) {
  const params = await searchParams;
  const order = typeof params.order === "string" && /^[0-9a-f-]{36}$/i.test(params.order) ? params.order : undefined;
  return (
    <div>
      <PageTitle title="Enter a bill" text="Add every item on the supplier's bill with its quantity and price." />
      <BillForm orderId={order} />
    </div>
  );
}

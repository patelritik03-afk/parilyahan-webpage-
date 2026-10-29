import OrderForm from "@/components/stock/OrderForm";
import { PageTitle } from "@/components/stock/ui";

export const metadata = { title: "New order" };

export default async function NewOrderPage({ searchParams }: PageProps<"/stock/orders/new">) {
  const params = await searchParams;
  return (
    <div>
      <PageTitle title="New order" text="Add the items, then send it to a head for approval." />
      <OrderForm fromPar={params.fromPar === "1"} />
    </div>
  );
}

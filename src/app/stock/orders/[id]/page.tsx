import OrderDetail from "@/components/stock/OrderDetail";
import { LinkButton, PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: PageProps<"/stock/orders/[id]">) {
  const { id } = await params;
  return (
    <div>
      <PageTitle title="Order" action={<LinkButton href="/stock/orders" outline>All orders</LinkButton>} />
      <OrderDetail id={id} />
    </div>
  );
}

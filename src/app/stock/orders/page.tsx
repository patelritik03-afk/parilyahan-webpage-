import OrdersList from "@/components/stock/OrdersList";
import { LinkButton, PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div>
      <PageTitle
        title="Orders"
        text="Make an order, send it for approval, and download the PDF any time."
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/stock/orders/new?fromPar=1" outline>
              Order what&apos;s below par
            </LinkButton>
            <LinkButton href="/stock/orders/new">+ New order</LinkButton>
          </div>
        }
      />
      <OrdersList />
    </div>
  );
}

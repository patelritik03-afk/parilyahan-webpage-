import BillsList from "@/components/stock/BillsList";
import { LinkButton, PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Bills" };

export default function BillsPage() {
  return (
    <div>
      <PageTitle
        title="Bills"
        text="Supplier bills add stock and keep prices up to date."
        action={<LinkButton href="/stock/bills/new">+ Enter a bill</LinkButton>}
      />
      <BillsList />
    </div>
  );
}

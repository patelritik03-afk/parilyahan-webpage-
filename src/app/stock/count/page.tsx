import CountsList from "@/components/stock/CountsList";
import { PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Stock check" };

export default function CountPage() {
  return (
    <div>
      <PageTitle
        title="Stock check"
        text="Count what is on the shelves. After a head approves, the counted quantities replace what the system had."
      />
      <CountsList />
    </div>
  );
}

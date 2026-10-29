import CountSheet from "@/components/stock/CountSheet";
import { LinkButton, PageTitle } from "@/components/stock/ui";

export const metadata = { title: "Stock check" };

export default async function CountSheetPage({ params }: PageProps<"/stock/count/[id]">) {
  const { id } = await params;
  return (
    <div>
      <PageTitle title="Stock check" action={<LinkButton href="/stock/count" outline>All stock checks</LinkButton>} />
      <CountSheet id={id} />
    </div>
  );
}

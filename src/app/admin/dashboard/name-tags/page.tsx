import NameTagsManager from "@/components/NameTagsManager";
import { todayISO } from "@/lib/date";
import { isoDateSchema } from "@/lib/validation";

export default async function AdminNameTagsPage({ searchParams }: PageProps<"/admin/dashboard/name-tags">) {
  const params = await searchParams;
  const requested = typeof params.date === "string" ? params.date : "";
  const date = isoDateSchema.safeParse(requested).success ? requested : todayISO();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Name Tags</h1>
      <p className="mt-1 text-sm text-muted">
        The dishes are picked out of the day&apos;s menu. Untick the ones you don&apos;t need, fix any wording, then
        download the Excel file or print.
      </p>
      <div className="mt-6">
        <NameTagsManager key={date} initialDate={date} />
      </div>
    </div>
  );
}

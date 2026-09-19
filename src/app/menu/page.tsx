import { supabaseAdmin } from "@/lib/supabase";
import MenuDisplay from "@/components/MenuDisplay";
import MenuDateHeader from "@/components/MenuDateHeader";
import { todayISO } from "@/lib/date";
import type { MenuItem } from "@/lib/types";

export const metadata = {
  title: "Menu | Parilyahan Sa Kalye",
};

export const revalidate = 0;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const params = await searchParams;
  const requested = typeof params.date === "string" ? params.date : undefined;
  const date = requested && DATE_RE.test(requested) ? requested : todayISO();

  const { data } = await supabaseAdmin
    .from("daily_menu")
    .select("items")
    .eq("date", date)
    .maybeSingle();

  const items = (data?.items ?? []) as MenuItem[];

  return (
    <>
      <MenuDateHeader date={date} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <MenuDisplay items={items} />
      </div>
    </>
  );
}

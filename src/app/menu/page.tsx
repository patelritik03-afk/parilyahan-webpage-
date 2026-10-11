import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import MenuDisplay from "@/components/MenuDisplay";
import MenuDateHeader from "@/components/MenuDateHeader";
import MenuPosterLink from "@/components/MenuPosterLink";
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
  const today = todayISO();
  // Customers can see today's menu and upcoming days, never past ones.
  if (requested && DATE_RE.test(requested) && requested < today) redirect("/menu");
  const date = requested && DATE_RE.test(requested) ? requested : today;

  const { data } = await supabaseAdmin
    .from("daily_menu")
    .select("items, updated_at")
    .eq("date", date)
    .maybeSingle();

  const items = (data?.items ?? []) as MenuItem[];
  // Changes whenever the menu is saved, so a re-saved menu always gets a fresh poster.
  const posterVersion = data?.updated_at ? Date.parse(data.updated_at) : 0;

  return (
    <>
      <MenuDateHeader date={date} today={today} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <MenuDisplay items={items} />
        {items.length > 0 && <MenuPosterLink date={date} version={posterVersion} />}
      </div>
    </>
  );
}

import "server-only";
import { supabaseAdmin } from "./supabase";

export type Offer = {
  id: string;
  title: string;
  price: number;
  note: string | null;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

// Never throws: if the table is missing or Supabase is down, the home page just shows no offers.
export async function getActiveOffers(): Promise<Offer[]> {
  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { isoDateSchema } from "@/lib/validation";
import { todayISO } from "@/lib/date";
import { extractTags } from "@/lib/nameTags";
import type { MenuItem } from "@/lib/types";

// The dishes of one day's menu, ready to become name tags.
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam && isoDateSchema.safeParse(dateParam).success ? dateParam : todayISO();

  const { data, error } = await supabaseAdmin.from("daily_menu").select("items").eq("date", date).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load the menu." }, { status: 500 });

  return NextResponse.json({ date, sections: extractTags((data?.items ?? []) as MenuItem[]) });
}

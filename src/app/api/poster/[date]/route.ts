import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isoDateSchema } from "@/lib/validation";
import { todayISO } from "@/lib/date";
import { renderPosterPng } from "@/lib/poster/render";
import type { MenuItem } from "@/lib/types";

const notFound = () => NextResponse.json({ error: "No poster for this date." }, { status: 404 });

// Customers can open the poster for today and upcoming days (same rule as the menu page).
// Past days are only available to the logged-in admin.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/poster/[date]">) {
  const limited = await enforceRateLimit("poster", request, { limit: 30, windowSec: 10 * 60 });
  if (limited) return limited;

  const { date } = await ctx.params;
  if (!isoDateSchema.safeParse(date).success) return notFound();

  const isPast = date < todayISO();
  if (isPast && !(await isAdminAuthenticated())) return notFound();

  const { data } = await supabaseAdmin.from("daily_menu").select("items").eq("date", date).maybeSingle();
  const items = (data?.items ?? []) as MenuItem[];
  if (items.length === 0) return notFound();

  let png: ArrayBuffer;
  try {
    png = await renderPosterPng(date, items);
  } catch (err) {
    console.error("Could not create the menu poster", err);
    return NextResponse.json({ error: "Could not create the poster." }, { status: 500 });
  }

  const params = request.nextUrl.searchParams;
  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    // The pages add ?v=<menu last saved> so an edited menu always gets a fresh poster.
    "Cache-Control": isPast
      ? "private, no-store"
      : params.get("v")
        ? "public, max-age=3600, s-maxage=604800"
        : "public, max-age=0, s-maxage=300",
  };
  if (params.get("download") === "1") {
    headers["Content-Disposition"] = `attachment; filename="parilyahan-menu-${date}.png"`;
  }
  return new Response(png, { headers });
}

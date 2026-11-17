import { NextResponse } from "next/server";
import { getCurrentCampaign, toPublic } from "@/lib/spin/server";

// Public: what the banners and the /spin page need (no chances, no limits).
export async function GET() {
  const current = await getCurrentCampaign();
  return NextResponse.json(
    { campaign: current ? toPublic(current.campaign, current.prizes) : null },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
  );
}

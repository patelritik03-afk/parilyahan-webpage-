import type { Metadata } from "next";
import SpinGame from "@/components/spin/SpinGame";
import { getCurrentCampaign, toPublic } from "@/lib/spin/server";

// The screen inside the restaurant: full screen, on-screen keys, resets itself after each player.
export const metadata: Metadata = {
  title: "Spin & Win (restaurant screen)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SpinKioskPage() {
  const current = await getCurrentCampaign();
  return <SpinGame campaign={current ? toPublic(current.campaign, current.prizes) : null} source="kiosk" kiosk />;
}

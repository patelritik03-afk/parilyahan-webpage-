import type { Metadata } from "next";
import SpinGame from "@/components/spin/SpinGame";
import { getCurrentCampaign, toPublic } from "@/lib/spin/server";
import { cleanSource } from "@/lib/spin/text";

export const metadata: Metadata = {
  title: "Spin & Win: free buffet, hotel stay & a ticket to the Philippines",
  description:
    "Spin the Parilyahan Sa Kalye wheel and win real prizes: a free Filipino buffet, 15% off, a 4-star hotel staycation or a free ticket to the Philippines. One spin per number.",
  alternates: { canonical: "/spin" },
  openGraph: {
    title: "Spin & Win at Parilyahan Sa Kalye 🎡",
    description: "Everyone wins something! Free buffet, hotel staycation and a ticket to the Philippines up for grabs.",
    images: [{ url: "/images/hero-buffet.webp", width: 2000, height: 1333 }],
  },
};

export default async function SpinPage({ searchParams }: PageProps<"/spin">) {
  const { src } = await searchParams;
  const current = await getCurrentCampaign();
  return (
    <SpinGame campaign={current ? toPublic(current.campaign, current.prizes) : null} source={cleanSource(Array.isArray(src) ? src[0] : src)} />
  );
}

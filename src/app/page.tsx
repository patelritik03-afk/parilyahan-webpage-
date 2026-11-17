import HomeContent from "@/components/HomeContent";
import StructuredData from "@/components/StructuredData";
import { getReviewData } from "@/lib/reviews";
import { getVideos } from "@/lib/videos";
import { getActiveOffers } from "@/lib/offers";
import { getCurrentCampaign, toPublic } from "@/lib/spin/server";

export const revalidate = 300;

export default async function Home() {
  const [reviews, videos, offers, spin] = await Promise.all([getReviewData(), getVideos(3), getActiveOffers(), getCurrentCampaign().catch(() => null)]);
  return (
    <>
      <StructuredData />
      <HomeContent reviews={reviews} videos={videos.map((v) => ({ videoId: v.video_id, title: v.title, thumbUrl: v.thumb_url }))} offers={offers} spin={spin ? toPublic(spin.campaign, spin.prizes) : null} />
    </>
  );
}


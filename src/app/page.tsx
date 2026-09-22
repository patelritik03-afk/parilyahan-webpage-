import HomeContent from "@/components/HomeContent";
import { getReviewData } from "@/lib/reviews";
import { getVideos } from "@/lib/videos";
import { getActiveOffers } from "@/lib/offers";

export const revalidate = 300;

export default async function Home() {
  const [reviews, videos, offers] = await Promise.all([getReviewData(), getVideos(3), getActiveOffers()]);
  return <HomeContent reviews={reviews} videoIds={videos.map((v) => v.video_id)} offers={offers} />;
}


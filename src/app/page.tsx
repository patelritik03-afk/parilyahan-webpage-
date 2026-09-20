import HomeContent from "@/components/HomeContent";
import { getReviewData } from "@/lib/reviews";
import { getVideos } from "@/lib/videos";

export const revalidate = 300;

export default async function Home() {
  const [reviews, videos] = await Promise.all([getReviewData(), getVideos(3)]);
  return <HomeContent reviews={reviews} videoIds={videos.map((v) => v.video_id)} />;
}


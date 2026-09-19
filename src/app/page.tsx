import HomeContent from "@/components/HomeContent";
import { getReviewData } from "@/lib/reviews";

export const revalidate = 300;

export default async function Home() {
  const reviews = await getReviewData();
  return <HomeContent reviews={reviews} />;
}

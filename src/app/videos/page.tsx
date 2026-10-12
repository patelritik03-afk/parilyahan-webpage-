import VideosContent from "@/components/VideosContent";
import { getVideos } from "@/lib/videos";

export const metadata = {
  title: "Videos",
  description:
    "Watch the latest videos from Parilyahan Sa Kalye: fresh dishes, buffet spreads and Filipino street food in Dubai.",
  alternates: { canonical: "/videos" },
};

export const revalidate = 300;

export default async function VideosPage() {
  const videos = await getVideos();
  return <VideosContent videoIds={videos.map((v) => v.video_id)} />;
}

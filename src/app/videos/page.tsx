import VideosContent from "@/components/VideosContent";
import { getVideos } from "@/lib/videos";

export const metadata = {
  title: "Videos | Parilyahan Sa Kalye",
};

export const revalidate = 300;

export default async function VideosPage() {
  const videos = await getVideos();
  return <VideosContent videoIds={videos.map((v) => v.video_id)} />;
}

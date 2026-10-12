import TikTokPlayer, { type VideoCard } from "./TikTokPlayer";

export type { VideoCard };

// Nothing from TikTok is downloaded until a visitor taps a video (see TikTokPlayer).
export default function VideoGrid({ videos, columns = 3 }: { videos: VideoCard[]; columns?: 3 | 4 }) {
  const layout = columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 ${layout}`}>
      {videos.map((video) => (
        <TikTokPlayer key={video.videoId} {...video} />
      ))}
    </div>
  );
}

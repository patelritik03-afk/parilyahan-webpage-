// TikTok's own embedded player: nothing is downloaded or re-hosted, and views count for TikTok.
export default function VideoGrid({ videoIds, columns = 3 }: { videoIds: string[]; columns?: 3 | 4 }) {
  const layout = columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 ${layout}`}>
      {videoIds.map((id) => (
        <div key={id} className="w-full max-w-[325px] overflow-hidden rounded-2xl border border-border bg-surface">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${id}`}
            title="TikTok video from Parilyahan Sa Kalye"
            loading="lazy"
            allow="encrypted-media; fullscreen"
            allowFullScreen
            className="block h-[575px] w-full"
          />
        </div>
      ))}
    </div>
  );
}

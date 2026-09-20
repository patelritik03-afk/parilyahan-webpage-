import VideosManager from "@/components/VideosManager";

export default function AdminVideosPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Videos</h1>
      <p className="mt-1 text-sm text-muted">
        Paste the link of a TikTok video to show it on the website. The newest video appears first.
      </p>
      <div className="mt-6">
        <VideosManager />
      </div>
    </div>
  );
}

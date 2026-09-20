"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { VideoRow } from "@/lib/videos";

export default function VideosManager() {
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/videos");
    const data = await res.json().catch(() => ({}));
    setVideos(data.videos ?? []);
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setUrl("");
      setMessage({ ok: true, text: "Video added. It now shows on the website." });
      await load();
    } else {
      setMessage({ ok: false, text: data.error ?? "Could not add the video." });
    }
  }

  async function handleRemove(video: VideoRow) {
    if (!confirm("Remove this video from the website?")) return;
    const res = await fetch("/api/admin/videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: video.id }),
    });
    if (res.ok) await load();
    else setMessage({ ok: false, text: "Could not remove the video." });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="max-w-2xl space-y-3">
        <label className="block text-sm font-medium text-foreground/80" htmlFor="tiktok-url">
          TikTok video link
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="tiktok-url"
            type="url"
            required
            placeholder="https://www.tiktok.com/@parilyahansakalye/video/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Adding..." : "Add video"}
          </button>
        </div>
        <p className="text-xs text-muted">On TikTok, open the video, tap Share, then Copy link, and paste it here.</p>
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
      </form>

      {videos === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-muted">No videos yet. Add your first one above.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {videos.map((video) => (
            <li key={video.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{video.title || "TikTok video"}</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary hover:underline"
                >
                  {video.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(video)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

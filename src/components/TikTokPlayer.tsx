"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export type VideoCard = { videoId: string; title: string | null; thumbUrl: string | null };

// Shows a light preview with a play button. TikTok's player (about 13 MB with its video, scripts and
// cookies) is only loaded when the visitor taps play, which keeps the page fast.
export default function TikTokPlayer({ videoId, title, thumbUrl }: VideoCard) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const label = title?.trim() || t("videos.play");

  return (
    <div className="relative aspect-[325/575] w-full max-w-[325px] overflow-hidden rounded-2xl border border-border bg-header">
      {playing ? (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          title={label}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${t("videos.play")}: ${label}`}
          className="group absolute inset-0 flex h-full w-full flex-col justify-end text-left"
        >
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small pre-sized preview from our own storage
            <img
              src={thumbUrl}
              alt=""
              width={360}
              height={640}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-primary via-[#8f0b21] to-header" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-transform group-hover:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          </span>
          <span className="relative line-clamp-3 p-4 text-sm font-semibold text-white">{title}</span>
        </button>
      )}
    </div>
  );
}

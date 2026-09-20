"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { TIKTOK_URL } from "@/lib/site";
import PageBanner from "./PageBanner";
import VideoGrid from "./VideoGrid";

export default function VideosContent({ videoIds }: { videoIds: string[] }) {
  const { t } = useLanguage();

  return (
    <>
      <PageBanner image="/images/hero-buffet.webp">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">{t("videos.eyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">{t("videos.title")}</h1>
        <p className="mt-3 max-w-xl text-white/80">{t("videos.subtitle")}</p>
      </PageBanner>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {videoIds.length === 0 ? (
          <p className="text-center text-muted">{t("videos.empty")}</p>
        ) : (
          <VideoGrid videoIds={videoIds} />
        )}
        <div className="mt-12 text-center">
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("videos.follow")}
          </a>
        </div>
      </div>
    </>
  );
}

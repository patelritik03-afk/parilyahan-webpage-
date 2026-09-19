"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { STATIC_GALLERY } from "@/lib/galleryData";
import type { GalleryImage } from "@/lib/types";

type Photo = { key: string; src: string; name: string | null; nameInImage: boolean };

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const photos: Photo[] = [
    ...images.map((image) => ({ key: image.id, src: image.url, name: image.caption, nameInImage: false })),
    ...STATIC_GALLERY.map((item) => ({
      key: item.src,
      src: item.src,
      name: item.name,
      nameInImage: item.group === "combo",
    })),
  ];

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
        {t("gallery.empty")}
      </p>
    );
  }

  const current = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.key}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={photo.name ?? "Open photo"}
            className="group relative aspect-[3/2] overflow-hidden rounded-xl bg-surface text-left"
          >
            <Image
              src={photo.src}
              alt={photo.name ?? "Parilyahan Sa Kalye"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {photo.name && !photo.nameInImage && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 text-sm font-semibold text-white">
                {photo.name}
              </span>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.name ?? "Photo"}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4"
          onClick={close}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              {t("gallery.close")}
            </button>
          </div>
          <div className="relative mt-3 flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              src={current.src}
              alt={current.name ?? "Parilyahan Sa Kalye"}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-2xl text-white hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => step(1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-2xl text-white hover:bg-black/70"
            >
              ›
            </button>
          </div>
          {current.name && (
            <p className="mt-3 text-center font-display text-lg font-semibold text-white">{current.name}</p>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { STATIC_GALLERY } from "@/lib/galleryData";
import type { ReviewData } from "@/lib/reviews";
import ReviewsSection from "./ReviewsSection";
import OffersSection from "./OffersSection";
import VideoGrid from "./VideoGrid";
import type { Offer } from "@/lib/offers";

const FEATURED = ["Busog Lusog", "Kare Kare", "Grilled Chicken Feet", "Adobong Alimango", "Lumpiang Shanghai", "Chicken Inasal"];

const featuredPhotos = FEATURED.map((name) => STATIC_GALLERY.find((g) => g.name === name)).filter(
  (g): g is (typeof STATIC_GALLERY)[number] => Boolean(g)
);

const icons = [
  <path key="a" d="M12 3c2 3 5 4 5 8a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 2 1.5 2.5 2 2.5C11 7 10.5 5 12 3Z" />,
  <path key="b" d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm4 9 2 2 4-4" />,
  <path key="c" d="M3 11h18M5 11a7 7 0 0 1 14 0M4 15h16l-1.5 5h-13L4 15Z" />,
];

export default function HomeContent({
  reviews,
  videoIds = [],
  offers = [],
}: {
  reviews: ReviewData;
  videoIds?: string[];
  offers?: Offer[];
}) {
  const { t } = useLanguage();

  const features = [
    { title: t("home.feature1Title"), body: t("home.feature1Body") },
    { title: t("home.feature2Title"), body: t("home.feature2Body") },
    { title: t("home.feature3Title"), body: t("home.feature3Body") },
  ];

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-header text-white">
        <Image src="/images/hero-atrium.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/50 to-black/85" />
        <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <h1 className="sr-only">{t("home.title")}</h1>
          <Image
            src="/brand/logo.png"
            alt=""
            width={900}
            height={377}
            priority
            className="w-72 drop-shadow-2xl sm:w-[26rem]"
          />
          <p className="mt-6 font-display text-sm font-semibold uppercase tracking-[0.25em] text-accent">
            {t("home.eyebrow")}
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">{t("home.subtitle")}</p>
          <p className="mt-5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            {t("home.hours")}
          </p>
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/reservation"
              className="w-full rounded-full bg-primary px-8 py-3 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              {t("home.reserveCta")}
            </Link>
            <Link
              href="/menu"
              className="w-full rounded-full border border-white/60 px-8 py-3 text-center font-semibold text-white transition-colors hover:bg-white hover:text-black sm:w-auto"
            >
              {t("home.menuCta")}
            </Link>
          </div>
        </div>
      </section>

      <OffersSection offers={offers} />

      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
          {features.map((item, i) => (
            <div key={item.title} className="rounded-2xl border border-border bg-background p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {icons[i]}
                </svg>
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
              {t("home.tasteEyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">{t("home.tasteTitle")}</h2>
          </div>
          <Link href="/gallery" className="text-sm font-semibold text-primary hover:underline">
            {t("home.tasteLink")} &rarr;
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {featuredPhotos.map((photo) => (
            <Link
              key={photo.src}
              href="/gallery"
              className="group relative aspect-[3/2] overflow-hidden rounded-xl bg-surface"
            >
              <Image
                src={photo.src}
                alt={photo.name ?? "Parilyahan Sa Kalye"}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {photo.group !== "combo" && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8 text-sm font-semibold text-white">
                  {photo.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {videoIds.length > 0 && (
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
                  {t("videos.eyebrow")}
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold">{t("videos.title")}</h2>
              </div>
              <Link href="/videos" className="text-sm font-semibold text-primary hover:underline">
                {t("videos.all")} &rarr;
              </Link>
            </div>
            <div className="mt-8">
              <VideoGrid videoIds={videoIds} />
            </div>
          </div>
        </section>
      )}

      <ReviewsSection data={reviews} />

      <section className="relative isolate overflow-hidden bg-header text-white">
        <Image src="/images/hero-buffet.webp" alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/65" />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("home.ctaTitle")}</h2>
          <p className="mt-4 text-white/80">{t("home.ctaBody")}</p>
          <Link
            href="/reservation"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("home.reserveCta")}
          </Link>
        </div>
      </section>
    </div>
  );
}

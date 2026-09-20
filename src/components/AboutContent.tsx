"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import PageBanner from "./PageBanner";
import type { AboutOverride } from "@/lib/aboutContent";

export default function AboutContent({ override = {} }: { override?: AboutOverride }) {
  const { t, lang } = useLanguage();
  const custom = override[lang];
  const title = custom?.title ?? t("about.title");
  const paragraphs = custom?.paragraphs ?? [t("about.p1"), t("about.p2")];

  return (
    <>
      <PageBanner image="/images/hero-buffet.webp">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
          {t("about.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">{title}</h1>
      </PageBanner>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
        <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
          {paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="/images/hero-atrium.webp"
            alt="Parilyahan Sa Kalye dining hall"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </>
  );
}

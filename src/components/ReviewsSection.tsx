"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ReviewData } from "@/lib/reviews";

const SLIDE_MS = 6500;

function GoogleG({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Stars({ className = "" }: { className?: string }) {
  return (
    <span className={`text-accent ${className}`} role="img" aria-label="5 out of 5 stars">
      ★★★★★
    </span>
  );
}

export default function ReviewsSection({ data }: { data: ReviewData }) {
  const { t } = useLanguage();
  const { reviews, rating, total, writeUrl, readUrl } = data;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = reviews.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  const summary =
    rating && total
      ? t("reviews.summary").replace("{rating}", rating.toFixed(1)).replace("{count}", String(total))
      : null;

  const step = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
          {t("reviews.eyebrow")}
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">{t("reviews.title")}</h2>
        {summary && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
            <GoogleG className="h-4 w-4" />
            <Stars />
            <span>{summary}</span>
          </p>
        )}

        {count > 0 ? (
          <div
            className="mt-10"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className="grid" aria-live="polite">
              {reviews.map((review, i) => (
                <figure
                  key={review.id}
                  aria-hidden={i !== index}
                  className={`col-start-1 row-start-1 flex flex-col items-center px-2 transition-opacity duration-700 sm:px-10 ${
                    i === index ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Stars className="text-2xl" />
                  <blockquote className="mt-5 line-clamp-6 text-lg leading-relaxed text-foreground/90 sm:text-xl">
                    “{review.text}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 text-left">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-semibold">{review.author}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <GoogleG className="h-3.5 w-3.5" />
                        {t("reviews.googleReview")}
                        {review.when && ` · ${review.when}`}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>

            {count > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label={t("reviews.prev")}
                  onClick={() => step(-1)}
                  className="h-9 w-9 rounded-full border border-border text-lg hover:border-primary hover:text-primary"
                >
                  ‹
                </button>
                <div className="flex items-center gap-2">
                  {reviews.map((review, i) => (
                    <button
                      key={review.id}
                      type="button"
                      aria-label={`${t("reviews.goTo")} ${i + 1}`}
                      aria-current={i === index}
                      onClick={() => setIndex(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-primary" : "w-2.5 bg-border hover:bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label={t("reviews.next")}
                  onClick={() => step(1)}
                  className="h-9 w-9 rounded-full border border-border text-lg hover:border-primary hover:text-primary"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="mx-auto mt-8 max-w-md rounded-lg border border-dashed border-border p-6 text-muted">
            {t("reviews.empty")}
          </p>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={writeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <GoogleG className="h-4 w-4" />
            </span>
            {t("reviews.write")}
          </a>
          {count > 0 && (
            <a
              href={readUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full border border-border px-7 py-3 text-center font-semibold transition-colors hover:border-primary hover:text-primary sm:w-auto"
            >
              {t("reviews.readAll")}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

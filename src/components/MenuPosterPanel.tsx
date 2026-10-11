"use client";

import { useState } from "react";

// Preview + download for the poster made from a saved menu. Mount it with key={date-version}
// so the preview starts fresh whenever the menu or its date changes.
export default function MenuPosterPanel({ date, version }: { date: string; version: number | string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const src = `/api/poster/${date}?v=${version}`;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold">Menu poster</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Made automatically from the saved menu for {date}: the left side stays the same, the date, day and menu change.
        Use it for WhatsApp, Instagram, TikTok or the screen at the entrance.
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-6">
        <div className="relative aspect-[9/16] w-56 overflow-hidden rounded-lg border border-border bg-background">
          {state === "loading" && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted">
              Creating poster...
            </p>
          )}
          {state === "error" && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-600">
              Could not create the poster. Save the menu and try again.
            </p>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- generated on demand, not a static asset */}
          <img
            src={src}
            alt={`Menu poster for ${date}`}
            onLoad={() => setState("ready")}
            onError={() => setState("error")}
            className={state === "ready" ? "h-full w-full object-cover" : "hidden"}
          />
        </div>
        <div className="flex flex-col gap-3">
          <a
            href={`${src}&download=1`}
            className="rounded-full bg-primary px-6 py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Download poster (PNG)
          </a>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm font-medium text-primary hover:underline"
          >
            Open full size
          </a>
        </div>
      </div>
    </section>
  );
}

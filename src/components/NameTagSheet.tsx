"use client";

import "./nameTags.css";
import { Cinzel } from "next/font/google";
import { chunkTags, tagFontPt } from "@/lib/nameTags";

// "Cinzel Black" is the font used on the existing name tags.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["900"], display: "swap" });

// The Excel sheet is scaled to about 66% when it is fitted to one A4 page; the printed tags match that.
const PRINT_SCALE = 0.66;

export default function NameTagSheet({ tags, maxPages }: { tags: string[]; maxPages?: number }) {
  const pages = chunkTags(tags).slice(0, maxPages ?? Infinity);

  return (
    <div className={cinzel.className}>
      {pages.map((page, pageIndex) => (
        <section key={pageIndex} className="psk-page">
          {page.map((text, i) => (
            <div key={`${text}-${i}`} className="psk-tag">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only logo served by our own route */}
              <img src="/api/admin/name-tags/logo" alt="" className="psk-logo" />
              <div className="psk-name" style={{ fontSize: `${tagFontPt(text.toUpperCase()) * PRINT_SCALE}pt` }}>
                {text}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

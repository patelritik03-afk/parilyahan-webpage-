"use client";

import { useState } from "react";
import { SOURCES } from "./shared";

const SITE = "https://www.parilyahansakalye.ae";

export default function QrPanel() {
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState("");
  const adSource = `ad-${custom.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30)}`;
  const rows = [...SOURCES, ...(custom.trim() ? [{ value: adSource, label: `Ad: ${custom.trim()}` }] : [])];

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <div>
      <p className="text-sm text-muted">
        Each place gets its own link and QR code, so the Stats tab shows where players came from. Print the table QR on table tents,
        put the Instagram link in your bio, and make a new &quot;ad&quot; link for every paid ad.
      </p>
      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <label className="text-sm font-semibold">
          New ad link (name of the ad)
          <input
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="e.g. december-reels"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>
      </div>
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
        {rows.map((s) => {
          const url = `${SITE}/spin?src=${s.value}`;
          return (
            <li key={s.value} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.label}</p>
                <p className="truncate font-mono text-xs text-muted">{url}</p>
              </div>
              <button type="button" onClick={() => copy(url)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary">
                {copied === url ? "Copied!" : "Copy link"}
              </button>
              <a href={`/api/admin/spin/qr?src=${s.value}`} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                QR code (PNG)
              </a>
            </li>
          );
        })}
        <li className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Restaurant screen (kiosk mode)</p>
            <p className="truncate font-mono text-xs text-muted">{SITE}/spin/kiosk</p>
            <p className="text-xs text-muted">Open this on the screen in full-screen mode. It resets itself after each player.</p>
          </div>
          <a href="/spin/kiosk" target="_blank" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary">
            Open ↗
          </a>
        </li>
      </ul>
    </div>
  );
}

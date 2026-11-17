"use client";

import { useEffect, useState } from "react";
import type { PublicCampaign } from "@/lib/spin/text";

// One request per page load, shared by the banner, the menu item and the floating button.
let cached: Promise<PublicCampaign | null> | null = null;

export function useSpinCampaign() {
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  useEffect(() => {
    cached ??= fetch("/api/spin/campaign")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.campaign ?? null) as PublicCampaign | null)
      .catch(() => null);
    let stop = false;
    cached.then((c) => !stop && setCampaign(c));
    return () => {
      stop = true;
    };
  }, []);
  return campaign?.running && campaign.banner ? campaign : null;
}

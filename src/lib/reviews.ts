import "server-only";
import { supabaseAdmin } from "./supabase";
import { GOOGLE_LISTING_URL, PLACE_SEARCH_QUERY } from "./site";

export type Review = {
  id: string;
  author: string;
  text: string;
  when: string;
  source: "google" | "manual";
  photoUrl?: string;
};

export type GoogleStatus = {
  configured: boolean;
  placeId: string | null;
  rating: number | null;
  total: number | null;
  mapsUri: string | null;
  reviews: Review[];
  error: string | null;
};

export type ReviewData = {
  reviews: Review[];
  rating: number | null;
  total: number | null;
  writeUrl: string;
  readUrl: string;
};

const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SHOWN = 12;
let cache: { at: number; value: GoogleStatus } | null = null;

const empty = (over: Partial<GoogleStatus>): GoogleStatus => ({
  configured: false,
  placeId: null,
  rating: null,
  total: null,
  mapsUri: null,
  reviews: [],
  error: null,
  ...over,
});

async function resolvePlaceId(apiKey: string): Promise<string> {
  if (process.env.GOOGLE_PLACE_ID) return process.env.GOOGLE_PLACE_ID;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: PLACE_SEARCH_QUERY }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Places search failed (${res.status})`);
  const id = data?.places?.[0]?.id;
  if (!id) throw new Error("Google could not find the restaurant listing. Set GOOGLE_PLACE_ID manually.");
  return id;
}

// Official Google Places API. Google only returns a handful of reviews per request, so this is
// combined with reviews the owner adds by hand in the dashboard.
export async function getGoogleStatus(force = false): Promise<GoogleStatus> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return empty({});
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value;

  try {
    const placeId = await resolvePlaceId(apiKey);
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Places request failed (${res.status})`);

    const reviews: Review[] = (data.reviews ?? [])
      .filter((r: { rating?: number; text?: { text?: string } }) => r.rating === 5 && r.text?.text)
      .map(
        (r: {
          name: string;
          text: { text: string };
          relativePublishTimeDescription?: string;
          authorAttribution?: { displayName?: string; photoUri?: string };
        }) => ({
          id: r.name,
          author: r.authorAttribution?.displayName ?? "Google user",
          text: r.text.text,
          when: r.relativePublishTimeDescription ?? "",
          source: "google" as const,
          photoUrl: r.authorAttribution?.photoUri,
        })
      );

    const value = empty({
      configured: true,
      placeId,
      rating: data.rating ?? null,
      total: data.userRatingCount ?? null,
      mapsUri: data.googleMapsUri ?? null,
      reviews,
    });
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    console.error("Google reviews fetch failed", err);
    return empty({ configured: true, error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export async function getManualReviews(includeHidden = false) {
  let query = supabaseAdmin
    .from("reviews")
    .select("id, author_name, review_text, when_text, visible, created_at")
    .order("created_at", { ascending: false });
  if (!includeHidden) query = query.eq("visible", true);

  const { data, error } = await query;
  if (error) {
    console.error("Manual reviews fetch failed", error);
    return [];
  }
  return data;
}

export function writeReviewUrl(placeId: string | null) {
  if (process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL) return process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;
  if (placeId) return `https://search.google.com/local/writereview?placeid=${placeId}`;
  return GOOGLE_LISTING_URL;
}

export async function getReviewData(): Promise<ReviewData> {
  const [google, manualRows] = await Promise.all([getGoogleStatus(), getManualReviews()]);

  const manual: Review[] = manualRows.map((r) => ({
    id: r.id,
    author: r.author_name,
    text: r.review_text,
    when: r.when_text ?? "",
    source: "manual",
  }));

  const seen = new Set<string>();
  const reviews = [...manual, ...google.reviews]
    .filter((r) => {
      const key = `${r.author.toLowerCase()}|${r.text.slice(0, 40).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SHOWN);

  return {
    reviews,
    rating: google.rating,
    total: google.total,
    writeUrl: writeReviewUrl(google.placeId),
    readUrl: google.mapsUri ?? GOOGLE_LISTING_URL,
  };
}

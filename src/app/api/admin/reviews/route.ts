import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { getGoogleStatus, getManualReviews, writeReviewUrl } from "@/lib/reviews";
import { GOOGLE_LISTING_URL } from "@/lib/site";

const createSchema = z.object({
  author: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(1500),
  when: z.string().trim().max(60).optional().default(""),
});

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const [google, manual] = await Promise.all([getGoogleStatus(refresh), getManualReviews(true)]);

  return NextResponse.json({
    manual,
    google,
    writeUrl: writeReviewUrl(google.placeId),
    listingUrl: GOOGLE_LISTING_URL,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter the reviewer's name and the review text." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("reviews").insert({
    author_name: parsed.data.author,
    review_text: parsed.data.text,
    when_text: parsed.data.when || null,
  });
  if (error) {
    console.error("Failed to save review", error);
    return NextResponse.json({ error: "Could not save the review." }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true }, { status: 201 });
}

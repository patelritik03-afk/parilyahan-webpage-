import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { getVideos } from "@/lib/videos";
import { resolveTikTokVideo } from "@/lib/tiktok";

const addSchema = z.object({ url: z.string().trim().min(1).max(500) });
const deleteSchema = z.object({ id: z.uuid() });

function refreshPages() {
  revalidatePath("/");
  revalidatePath("/videos");
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ videos: await getVideos() });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Paste a TikTok video link." }, { status: 400 });
  }

  const video = await resolveTikTokVideo(parsed.data.url);
  if (!video) {
    return NextResponse.json(
      { error: "That does not look like a TikTok video link. Open the video on TikTok, tap Share, then Copy link." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("videos").insert({
    video_id: video.videoId,
    url: video.url,
    title: video.title,
    author: video.author,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That video is already added." }, { status: 409 });
    }
    console.error("Failed to save video", error);
    return NextResponse.json(
      { error: "Could not save. The videos table may be missing in Supabase." },
      { status: 500 }
    );
  }

  refreshPages();
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid video." }, { status: 400 });

  const { error } = await supabaseAdmin.from("videos").delete().eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "Could not remove the video." }, { status: 500 });

  refreshPages();
  return NextResponse.json({ ok: true });
}

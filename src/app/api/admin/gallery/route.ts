import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const BUCKET = "site-images";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// Vercel serverless functions reject request bodies above 4.5 MB.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_EDGE_PX = 1600;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not load gallery" }, { status: 500 });
  }

  return NextResponse.json({ images: data ?? [] });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG or WebP photos are allowed." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 4 MB)." }, { status: 400 });
  }

  // Re-encoding proves the bytes are really an image and strips metadata.
  let image: Buffer;
  try {
    image = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "That file is not a valid photo." }, { status: 400 });
  }

  const path = `gallery/${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, image, { contentType: "image/webp" });

  if (uploadError) {
    console.error("Gallery upload failed", uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabaseAdmin
    .from("gallery_images")
    .insert({ url: publicUrlData.publicUrl, storage_path: path, caption: null, sort_order: 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not save image" }, { status: 500 });
  }

  return NextResponse.json({ image: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: image } = await supabaseAdmin
    .from("gallery_images")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (image?.storage_path) {
    await supabaseAdmin.storage.from(BUCKET).remove([image.storage_path]);
  }

  const { error } = await supabaseAdmin.from("gallery_images").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not delete image" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

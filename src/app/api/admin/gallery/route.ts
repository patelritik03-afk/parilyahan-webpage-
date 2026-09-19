import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "site-images";

export async function GET() {
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
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `gallery/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

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

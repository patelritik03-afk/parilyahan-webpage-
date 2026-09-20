import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { cleanAboutText, type AboutOverride } from "@/lib/aboutContent";
import { getAboutOverride, resetAboutOverride, saveAboutOverride } from "@/lib/aboutStore";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ content: await getAboutOverride() });
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const en = cleanAboutText(body?.en);
  const tl = cleanAboutText(body?.tl);
  if (!en || !tl) {
    return NextResponse.json(
      { error: "Each language needs a title and at least one paragraph." },
      { status: 400 }
    );
  }

  const content: AboutOverride = { en, tl };
  if (!(await saveAboutOverride(content))) {
    return NextResponse.json(
      { error: "Could not save. The admin_settings table may be missing in Supabase." },
      { status: 500 }
    );
  }
  revalidatePath("/about");
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!(await resetAboutOverride())) {
    return NextResponse.json({ error: "Could not reset the text." }, { status: 500 });
  }
  revalidatePath("/about");
  return NextResponse.json({ ok: true });
}

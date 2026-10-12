import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isoDateSchema } from "@/lib/validation";
import { MAX_TAGS } from "@/lib/nameTags";
import { buildNameTagWorkbook } from "@/lib/nameTagWorkbook";

const bodySchema = z.object({
  date: isoDateSchema,
  tags: z.array(z.string().trim().min(1).max(120)).min(1).max(MAX_TAGS),
});

// Builds the printable Excel file for the tags the owner ticked.
export async function POST(request: NextRequest) {
  const denied = await requireAdmin("name-tags");
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose at least one tag to print." }, { status: 400 });
  }

  try {
    const file = await buildNameTagWorkbook(parsed.data.tags);
    return new Response(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="name-tags-${parsed.data.date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Could not build the name tag file", err);
    return NextResponse.json({ error: "Could not create the file." }, { status: 500 });
  }
}

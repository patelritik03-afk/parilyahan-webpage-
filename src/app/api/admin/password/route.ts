import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getPasswordHash, savePassword } from "@/lib/adminPassword";

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(12, "The new password must be at least 12 characters.").max(200),
});

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const limited = await enforceRateLimit("password", request, { limit: 10, windowSec: 15 * 60 });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please fill in both passwords." },
      { status: 400 }
    );
  }

  const hash = await getPasswordHash();
  if (!hash || !(await bcrypt.compare(parsed.data.current, hash))) {
    return NextResponse.json({ error: "The current password is incorrect." }, { status: 401 });
  }

  if (!(await savePassword(parsed.data.next))) {
    return NextResponse.json(
      { error: "Could not save. The admin_settings table may be missing in Supabase." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

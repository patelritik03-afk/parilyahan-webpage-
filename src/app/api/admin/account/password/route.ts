import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { changeStaffPassword } from "@/lib/staffUsers";

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(12, "The new password must be at least 12 characters.").max(200),
});

// Lets a staff member change their own password. The owner changes theirs under Settings.
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "staff") {
    return NextResponse.json({ error: "Use Settings to change the owner password." }, { status: 403 });
  }

  const limited = await enforceRateLimit("password", request, { limit: 10, windowSec: 15 * 60 });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please fill in both passwords." },
      { status: 400 }
    );
  }

  const result = await changeStaffPassword(session.username, parsed.data.current, parsed.data.next);
  if (result === "wrong-current") {
    return NextResponse.json({ error: "The current password is incorrect." }, { status: 401 });
  }
  if (result === "failed") {
    return NextResponse.json({ error: "Could not save the new password. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

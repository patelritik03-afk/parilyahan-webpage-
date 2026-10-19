import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { AREAS, STAFF_ROLES } from "@/lib/adminAreas";
import { resetStaffPassword, updateStaffAccount } from "@/lib/staffUsers";

const patchSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  areas: z.array(z.enum(AREAS)).max(AREAS.length).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  active: z.boolean().optional(),
  resetPassword: z.literal(true).optional(),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/staff/[username]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const limited = await enforceRateLimit("staff-accounts", request, { limit: 30, windowSec: 15 * 60 });
  if (limited) return limited;

  const { username } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  }

  const { resetPassword, ...patch } = parsed.data;
  if (resetPassword) {
    const password = await resetStaffPassword(username);
    if (!password) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    return NextResponse.json({ password });
  }

  if (!(await updateStaffAccount(username, patch))) {
    return NextResponse.json({ error: "Could not save the changes." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

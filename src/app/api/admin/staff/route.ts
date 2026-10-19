import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { AREAS, STAFF_ROLES } from "@/lib/adminAreas";
import { createStaffAccount, listStaffAccounts } from "@/lib/staffUsers";

const staffAccountSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "Username: 3-30 letters, numbers, dots or dashes, no spaces.")
    .refine((v) => !["owner", "admin"].includes(v), "That username is reserved."),
  displayName: z.string().trim().min(1, "Enter a name.").max(60),
  areas: z.array(z.enum(AREAS)).max(AREAS.length),
  role: z.enum(STAFF_ROLES),
});

// Owner only: requireAdmin() without an area lets no staff account in.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ accounts: await listStaffAccounts() });
  } catch (err) {
    console.error("Could not list staff accounts", err);
    return NextResponse.json({ error: "Could not load the accounts." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const limited = await enforceRateLimit("staff-accounts", request, { limit: 30, windowSec: 15 * 60 });
  if (limited) return limited;

  const parsed = staffAccountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  }
  const result = await createStaffAccount(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  // The password is shown to the owner once; only its hash is stored.
  return NextResponse.json({ password: result.password }, { status: 201 });
}

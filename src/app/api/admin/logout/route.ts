import { NextResponse } from "next/server";
import { clearAdminSession, requireAdmin } from "@/lib/auth";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  await clearAdminSession();
  return NextResponse.json({ ok: true });
}

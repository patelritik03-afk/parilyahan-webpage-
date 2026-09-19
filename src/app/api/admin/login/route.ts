import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("login", request, { limit: 10, windowSec: 15 * 60 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    console.error("ADMIN_PASSWORD_HASH is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  try {
    await createAdminSession();
  } catch (err) {
    console.error("Could not create admin session", err);
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

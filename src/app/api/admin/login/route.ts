import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSession, createStaffSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getPasswordHash } from "@/lib/adminPassword";
import { checkStaffLogin } from "@/lib/staffUsers";
import { firstAreaPage } from "@/lib/adminAreas";

const OWNER_NAMES = new Set(["", "owner", "admin"]);

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("login", request, { limit: 10, windowSec: 15 * 60 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase().slice(0, 60) : "";
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  if (!OWNER_NAMES.has(username)) {
    const user = await checkStaffLogin(username, password);
    if (!user) {
      return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
    }
    try {
      await createStaffSession(user);
    } catch (err) {
      console.error("Could not create staff session", err);
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }
    // Where this person starts: the stock dashboard for stock staff, otherwise their first area.
    return NextResponse.json({ ok: true, home: firstAreaPage(user.areas) });
  }

  const hash = await getPasswordHash();
  if (!hash) {
    console.error("No admin password is configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  try {
    await createAdminSession();
  } catch (err) {
    console.error("Could not create admin session", err);
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

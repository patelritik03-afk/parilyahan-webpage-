import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "psk_admin_session";
const MIN_SECRET_LENGTH = 32;

async function hasValidSession(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (await hasValidSession(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/:path*"],
};

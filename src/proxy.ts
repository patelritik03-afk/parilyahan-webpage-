import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "psk_admin_session";

function getSecretKey() {
  return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isApiRoute = pathname.startsWith("/api/");

  const valid = token
    ? await jwtVerify(token, getSecretKey())
        .then(() => true)
        .catch(() => false)
    : false;

  if (valid) return NextResponse.next();

  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/:path*"],
};

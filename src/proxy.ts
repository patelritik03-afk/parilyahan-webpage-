import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { areaForPath, firstAreaPage, toAreas } from "@/lib/adminAreas";

const COOKIE_NAME = "psk_admin_session";
const MIN_SECRET_LENGTH = 32;

async function readSession(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get(COOKIE_NAME)?.value);
  const isApi = pathname.startsWith("/api/");

  if (session?.role === "admin") {
    return NextResponse.next();
  }

  if (session?.role === "staff") {
    const areas = toAreas(session.areas);
    const needed = areaForPath(pathname);
    if (needed === "any" || (needed !== "owner" && areas.includes(needed))) {
      return NextResponse.next();
    }
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL(firstAreaPage(areas), request.url));
  }

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/admin", request.url);
  if (areaForPath(pathname) === "stock") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/:path*", "/stock", "/stock/:path*"],
};

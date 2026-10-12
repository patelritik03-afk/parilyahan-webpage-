import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AREAS, toAreas, type Area } from "./adminAreas";
import { findActiveStaff } from "./staffUsers";

const COOKIE_NAME = "psk_admin_session";
const OWNER_SESSION_SECONDS = 60 * 60 * 24 * 7;
const STAFF_SESSION_SECONDS = 60 * 60 * 24;
const ALG = "HS256";
export const MIN_SECRET_LENGTH = 32;

export type AdminSession = { role: "owner" | "staff"; username: string; name: string; areas: readonly Area[] };

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`ADMIN_SESSION_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`);
  }
  return new TextEncoder().encode(secret);
}

async function setSessionCookie(payload: Record<string, unknown>, seconds: number) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: seconds,
  });
}

export async function createAdminSession() {
  await setSessionCookie({ role: "admin" }, OWNER_SESSION_SECONDS);
}

export async function createStaffSession(user: { username: string; areas: Area[] }) {
  await setSessionCookie({ role: "staff", sub: user.username, areas: user.areas }, STAFF_SESSION_SECONDS);
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Returns who is signed in. A staff session is checked against the database every time, so
// switching an account off or changing its areas takes effect straight away.
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSecretKey(), { algorithms: [ALG] }));
  } catch {
    return null;
  }

  if (payload.role === "admin") {
    return { role: "owner", username: "owner", name: "Owner", areas: AREAS };
  }
  if (payload.role === "staff" && typeof payload.sub === "string") {
    const user = await findActiveStaff(payload.sub);
    if (!user) return null;
    return { role: "staff", username: user.username, name: user.displayName, areas: toAreas(user.areas) };
  }
  return null;
}

export async function isAdminAuthenticated() {
  return (await getAdminSession()) !== null;
}

// Every /api/admin handler calls this first so the proxy is not the only gate.
// With no area the route is owner-only; pass an area to let staff with that area in too.
export async function requireAdmin(area?: Area) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "owner") return null;
  if (area && session.areas.includes(area)) return null;
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

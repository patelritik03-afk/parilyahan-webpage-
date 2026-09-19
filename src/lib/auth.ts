import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "psk_admin_session";
const SESSION_DURATION = "7d";
const ALG = "HS256";
export const MIN_SECRET_LENGTH = 32;

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`ADMIN_SESSION_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`);
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey(), { algorithms: [ALG] });
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// Every /api/admin handler calls this first so the proxy is not the only gate.
export async function requireAdmin() {
  if (await isAdminAuthenticated()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

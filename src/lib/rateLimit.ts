import "server-only";
import { NextRequest, NextResponse } from "next/server";

export type RateLimitRule = { limit: number; windowSec: number };

type Bucket = { count: number; expiresAt: number };
const memory = new Map<string, Bucket>();

export function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

function countInMemory(key: string, windowSec: number) {
  const now = Date.now();
  if (memory.size > 5000) {
    for (const [k, b] of memory) if (b.expiresAt <= now) memory.delete(k);
  }
  const bucket = memory.get(key);
  if (!bucket || bucket.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
}

// Upstash Redis REST (optional). Without it, limits are per server instance only.
async function countInUpstash(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSec],
    ]),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const data = (await res.json()) as { result: number }[];
  return Number(data[0]?.result);
}

export async function enforceRateLimit(name: string, request: NextRequest, rule: RateLimitRule) {
  const windowStart = Math.floor(Date.now() / (rule.windowSec * 1000));
  const key = `rl:${name}:${clientIp(request)}:${windowStart}`;

  let count: number;
  try {
    count = (await countInUpstash(key, rule.windowSec)) ?? countInMemory(key, rule.windowSec);
  } catch (err) {
    console.error("Rate limit store failed, using in-memory fallback", err);
    count = countInMemory(key, rule.windowSec);
  }

  if (count > rule.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rule.windowSec) } }
    );
  }
  return null;
}

import { z } from "zod";
import { todayISO } from "./date";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parts(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

function isRealDate(value: string) {
  const { y, m, d } = parts(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function addDays(value: string, days: number) {
  const { y, m, d } = parts(value);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export const isoDateSchema = z.string().regex(ISO_DATE, "Enter a valid date.").refine(isRealDate, "Enter a valid date.");

export function upcomingDateSchema(maxDaysAhead: number, message: string) {
  return isoDateSchema.refine((value) => {
    const today = todayISO();
    return value >= today && value <= addDays(today, maxDaysAhead);
  }, message);
}

// Bots fill every field they see; real visitors never see this one.
export const HONEYPOT_FIELD = "website";

export function isHoneypotFilled(body: unknown) {
  return typeof body === "object" && body !== null && Boolean((body as Record<string, unknown>)[HONEYPOT_FIELD]);
}

// Shared by the proxy (edge-safe, no server-only imports) and the server code.
// The owner can open everything; a staff account only the areas ticked on it.

export const AREAS = ["menu", "name-tags", "reservations"] as const;
export type Area = (typeof AREAS)[number];

export function isArea(value: unknown): value is Area {
  return typeof value === "string" && (AREAS as readonly string[]).includes(value);
}

export function toAreas(value: unknown): Area[] {
  return Array.isArray(value) ? value.filter(isArea) : [];
}

const PAGE_PREFIX = "/admin/dashboard/";
const API_PREFIX = "/api/admin/";

function startsWithSegment(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

// "any"   = every signed-in user, "owner" = owner only (the default for anything not listed).
export function areaForPath(pathname: string): Area | "any" | "owner" {
  if (pathname === "/admin/dashboard" || pathname === "/api/admin/logout") return "any";
  for (const area of AREAS) {
    if (startsWithSegment(pathname, `${PAGE_PREFIX}${area}`) || startsWithSegment(pathname, `${API_PREFIX}${area}`)) {
      return area;
    }
  }
  return "owner";
}

export function firstAreaPage(areas: Area[]) {
  return areas.length > 0 ? `${PAGE_PREFIX}${areas[0]}` : "/admin";
}

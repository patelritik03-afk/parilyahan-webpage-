// Shared by the proxy (edge-safe, no server-only imports) and the server code.
// The owner can open everything; a staff account only the areas ticked on it.

export const AREAS = ["menu", "name-tags", "reservations", "stock"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABELS: Record<Area, string> = {
  menu: "Menu",
  "name-tags": "Name Tags",
  reservations: "Reservations",
  stock: "Stock",
};

// A "head" approves orders and stock checks, sets par levels and sees costs; "staff" make entries.
export const STAFF_ROLES = ["staff", "head"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function toStaffRole(value: unknown): StaffRole {
  return value === "head" ? "head" : "staff";
}

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
  if (
    pathname === "/admin/dashboard" ||
    pathname === "/api/admin/logout" ||
    startsWithSegment(pathname, "/admin/dashboard/account") ||
    startsWithSegment(pathname, "/api/admin/account")
  ) {
    return "any";
  }
  // The stock app lives at /stock on the main domain (its own layout, still behind the admin login).
  if (startsWithSegment(pathname, STOCK_APP_PATH)) return "stock";
  for (const area of AREAS) {
    if (startsWithSegment(pathname, `${PAGE_PREFIX}${area}`) || startsWithSegment(pathname, `${API_PREFIX}${area}`)) {
      return area;
    }
  }
  return "owner";
}

export const STOCK_APP_PATH = "/stock";

export function areaHomePage(area: Area) {
  return area === "stock" ? STOCK_APP_PATH : `${PAGE_PREFIX}${area}`;
}

export function firstAreaPage(areas: Area[]) {
  return areas.length > 0 ? areaHomePage(areas[0]) : "/admin";
}

// Where the login page may send someone back to; anything else falls back to the dashboard.
export function safeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return startsWithSegment(value.split("?")[0], STOCK_APP_PATH) || value.startsWith("/admin/dashboard") ? value : null;
}

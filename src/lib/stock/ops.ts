// Shared by the stock screens and routes (no server-only imports).

export const WASTAGE_REASONS = ["Expired", "Spoiled", "Burnt / overcooked", "Dropped / damaged", "Leftover thrown", "Other"];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Waiting for approval",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  cancelled: "Cancelled",
};

export const COUNT_STATUS_LABEL: Record<string, string> = {
  draft: "Counting",
  submitted: "Waiting for approval",
  approved: "Approved",
};

export const formatOrderNumber = (n: number) => `PO-${String(n).padStart(4, "0")}`;

export function todayDubai() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

// Units an item can be entered in: its base unit, plus the purchase unit if it has one.
export function itemUnits(item: { base_unit: string; purchase_unit: string | null; purchase_factor: number }) {
  const units = [{ unit: item.base_unit, factor: 1, label: item.base_unit }];
  if (item.purchase_unit && item.purchase_unit !== item.base_unit) {
    units.push({
      unit: item.purchase_unit,
      factor: item.purchase_factor,
      label: `${item.purchase_unit} (${item.purchase_factor} ${item.base_unit})`,
    });
  }
  return units;
}

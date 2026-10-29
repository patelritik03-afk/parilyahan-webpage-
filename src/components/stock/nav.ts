import type { IconName } from "./icons";

export type NavItem = { href: string; label: string; short?: string; icon: IconName; managerOnly?: boolean; text: string };

export const STOCK_NAV: NavItem[] = [
  { href: "/stock", label: "Dashboard", short: "Home", icon: "dashboard", text: "Today at a glance" },
  { href: "/stock/items", label: "Items", icon: "items", text: "Stock levels, search any item" },
  { href: "/stock/usage", label: "Daily usage", short: "Usage", icon: "usage", text: "What was used and wasted" },
  { href: "/stock/bills", label: "Bills", icon: "bills", text: "Enter supplier bills, stock in" },
  { href: "/stock/orders", label: "Orders", icon: "orders", text: "Make, approve, download PDF" },
  { href: "/stock/count", label: "Stock check", icon: "count", text: "Count the store" },
  { href: "/stock/suppliers", label: "Suppliers", icon: "suppliers", text: "Contacts and details" },
  { href: "/stock/prices", label: "Prices", icon: "alert", managerOnly: true, text: "Price rises and history" },
  { href: "/stock/reports", label: "Reports", icon: "reports", managerOnly: true, text: "Food cost, top items, slow movers" },
  { href: "/stock/import", label: "Import / Export", icon: "import", managerOnly: true, text: "Items in Excel" },
];

// The phone bottom bar shows these; everything else is on the "More" page.
export const PHONE_BAR = ["/stock", "/stock/items", "/stock/usage", "/stock/bills"];

export function visibleNav(manager: boolean) {
  return STOCK_NAV.filter((n) => manager || !n.managerOnly);
}

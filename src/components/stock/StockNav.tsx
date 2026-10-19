"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StockIcon, type IconName } from "./icons";

type NavItem = { href: string; label: string; icon: IconName; managerOnly?: boolean; soon?: boolean };

const NAV: NavItem[] = [
  { href: "/stock", label: "Dashboard", icon: "dashboard" },
  { href: "/stock/items", label: "Items", icon: "items" },
  { href: "/stock/bills", label: "Bills", icon: "bills", soon: true },
  { href: "/stock/usage", label: "Daily usage", icon: "usage", soon: true },
  { href: "/stock/count", label: "Stock check", icon: "count", soon: true },
  { href: "/stock/orders", label: "Orders", icon: "orders", soon: true },
  { href: "/stock/suppliers", label: "Suppliers", icon: "suppliers" },
  { href: "/stock/reports", label: "Reports", icon: "reports", managerOnly: true, soon: true },
  { href: "/stock/import", label: "Import / Export", icon: "import", managerOnly: true },
];

function isActive(pathname: string, href: string) {
  return href === "/stock" ? pathname === "/stock" : pathname === href || pathname.startsWith(`${href}/`);
}

// Desktop: a sidebar with big icons. Phone: a bottom bar with the sections that are ready.
export default function StockNav({ manager }: { manager: boolean }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => manager || !n.managerOnly);
  const ready = items.filter((n) => !n.soon);

  return (
    <>
      <nav aria-label="Stock sections" className="hidden w-56 shrink-0 md:block">
        <ul className="sticky top-20 space-y-1.5">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const body = (
              <>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-white/20" : item.soon ? "bg-border/40" : "bg-primary/10 text-primary"
                  }`}
                >
                  <StockIcon name={item.icon} className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{item.label}</span>
                  {item.soon && <span className="block text-xs opacity-70">Coming soon</span>}
                </span>
              </>
            );
            return (
              <li key={item.href}>
                {item.soon ? (
                  <span className="flex items-center gap-3 rounded-2xl px-2 py-2 text-foreground/45" aria-disabled="true">
                    {body}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-surface"
                    }`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Stock sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-lg justify-around">
          {ready.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${active ? "text-primary" : "text-foreground/70"}`}
                >
                  <span className={`flex h-10 w-14 items-center justify-center rounded-2xl ${active ? "bg-primary/15" : ""}`}>
                    <StockIcon name={item.icon} className="h-7 w-7" />
                  </span>
                  <span className="max-w-full truncate px-1">{item.label === "Import / Export" ? "Import" : item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

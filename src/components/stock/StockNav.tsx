"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StockIcon } from "./icons";
import { PHONE_BAR, visibleNav } from "./nav";

function isActive(pathname: string, href: string) {
  return href === "/stock" ? pathname === "/stock" : pathname === href || pathname.startsWith(`${href}/`);
}

// Desktop: a sidebar with big icons. Phone: a bottom bar with the main sections and "More".
export default function StockNav({ manager }: { manager: boolean }) {
  const pathname = usePathname();
  const items = visibleNav(manager);
  const bar = items.filter((n) => PHONE_BAR.includes(n.href));
  const moreActive = !bar.some((n) => isActive(pathname, n.href));

  return (
    <>
      <nav aria-label="Stock sections" className="hidden w-56 shrink-0 md:block">
        <ul className="sticky top-20 space-y-1.5">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-primary/10 text-primary"}`}
                  >
                    <StockIcon name={item.icon} className="h-6 w-6" />
                  </span>
                  <span className="truncate font-semibold">{item.label}</span>
                </Link>
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
          {[...bar, { href: "/stock/more", label: "More", short: "More", icon: "more" as const }].map((item) => {
            const active = item.href === "/stock/more" ? moreActive : isActive(pathname, item.href);
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
                  <span className="max-w-full truncate px-1">{item.short ?? item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

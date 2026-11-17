"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Area } from "@/lib/adminAreas";

// `area` ties a tab to a staff permission; tabs without one are for the owner only.
const tabs: { href: string; label: string; area?: Area; staffOnly?: boolean }[] = [
  { href: "/admin/dashboard/menu", label: "Menu", area: "menu" },
  { href: "/admin/dashboard/name-tags", label: "Name Tags", area: "name-tags" },
  { href: "/admin/dashboard/offers", label: "Offers" },
  { href: "/admin/dashboard/reservations", label: "Reservations", area: "reservations" },
  { href: "/stock", label: "Stock", area: "stock" },
  { href: "/admin/dashboard/spin", label: "Spin & Win", area: "spin" },
  { href: "/admin/dashboard/enquiries", label: "Enquiries" },
  { href: "/admin/dashboard/gallery", label: "Gallery" },
  { href: "/admin/dashboard/reviews", label: "Reviews" },
  { href: "/admin/dashboard/videos", label: "Videos" },
  { href: "/admin/dashboard/about", label: "About Us" },
  { href: "/admin/dashboard/settings", label: "Settings" },
  { href: "/admin/dashboard/account", label: "My Password", staffOnly: true },
];

export default function DashboardNav({
  ownerAccess,
  areas,
  signedInAs,
}: {
  ownerAccess: boolean;
  areas: Area[];
  signedInAs?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleTabs = tabs.filter((tab) =>
    ownerAccess ? !tab.staffOnly : tab.staffOnly || (tab.area !== undefined && areas.includes(tab.area))
  );
  const showSpin = visibleTabs.some((tab) => tab.area === "spin");
  const [newWins, setNewWins] = useState(0);

  // New Spin & Win coupons since someone last opened the coupon list.
  useEffect(() => {
    if (!showSpin) return;
    let stop = false;
    const load = () =>
      fetch("/api/admin/spin?count=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !stop && d && setNewWins(Number(d.unseen) || 0))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [showSpin, pathname]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <nav className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              pathname === tab.href
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-foreground/80 hover:text-primary"
            }`}
          >
            {tab.label}
            {tab.area === "spin" && newWins > 0 && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">{newWins}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        {signedInAs && <span className="text-sm text-muted">Signed in as {signedInAs}</span>}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-muted hover:text-primary"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

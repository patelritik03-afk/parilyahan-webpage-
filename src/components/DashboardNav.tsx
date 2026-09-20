"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/admin/dashboard/menu", label: "Menu" },
  { href: "/admin/dashboard/reservations", label: "Reservations" },
  { href: "/admin/dashboard/enquiries", label: "Enquiries" },
  { href: "/admin/dashboard/gallery", label: "Gallery" },
  { href: "/admin/dashboard/reviews", label: "Reviews" },
  { href: "/admin/dashboard/settings", label: "Settings" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
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
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm font-medium text-muted hover:text-primary"
      >
        Log out
      </button>
    </div>
  );
}

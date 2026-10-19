"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function StockHeader({
  name,
  roleLabel,
  showAdminLink,
}: {
  name: string;
  roleLabel: string;
  showAdminLink: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-header text-header-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link href="/stock" className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="Parilyahan sa Kalye" width={900} height={377} sizes="100px" className="h-9 w-auto" />
          <span className="font-display text-lg font-bold">Stock</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-header-foreground/70 sm:inline">
            {name} - {roleLabel}
          </span>
          {pathname !== "/stock" && (
            <Link href="/stock" className="font-medium text-header-foreground/85 hover:text-accent">
              Home
            </Link>
          )}
          {showAdminLink && (
            <Link href="/admin/dashboard" className="font-medium text-header-foreground/85 hover:text-accent">
              Admin
            </Link>
          )}
          <button type="button" onClick={handleLogout} className="font-medium text-header-foreground/85 hover:text-accent">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

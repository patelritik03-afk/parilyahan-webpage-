import Link from "next/link";
import { getAdminSession, isStockManager } from "@/lib/auth";
import { listStockItems, listSuppliers } from "@/lib/stock/items";
import { supabaseAdmin } from "@/lib/supabase";
import { todayISO } from "@/lib/date";
import { PAR_COVER_DAYS, PAR_HISTORY_DAYS, getParSuggestions } from "@/lib/stock/parSuggestions";
import { formatAed, formatQty, type StockItem } from "@/lib/stock/types";
import { StockIcon, type IconName } from "@/components/stock/icons";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dubai" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn" ? "bg-red-100 text-red-700" : tone === "good" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary";
  const body = (
    <>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
        <StockIcon name={icon} className="h-7 w-7" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-muted">{label}</span>
        <span className="block break-words font-display text-xl font-bold leading-tight sm:text-2xl">{value}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </>
  );
  // Two per row on a phone (icon above the number), icon beside the number on bigger screens.
  const className =
    "flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-primary`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function QuickAction({ href, icon, label, text }: { href: string; icon: IconName; label: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-center shadow-sm transition-colors hover:border-primary"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <StockIcon name={icon} className="h-9 w-9" />
      </span>
      <span className="font-display font-semibold">{label}</span>
      <span className="text-xs text-muted">{text}</span>
    </Link>
  );
}

const belowPar = (i: StockItem) => i.par_level !== null && i.qty < i.par_level;

export default async function StockDashboard() {
  const session = await getAdminSession();
  const manager = session ? isStockManager(session) : false;
  const [allItems, suppliers, waiting, alerts, usedToday] = await Promise.all([
    listStockItems(manager),
    listSuppliers(),
    supabaseAdmin.from("purchase_orders").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabaseAdmin.from("price_alerts").select("id", { count: "exact", head: true }).is("seen_at", null),
    supabaseAdmin.from("stock_movements").select("id", { count: "exact", head: true }).eq("ref_type", "usage").eq("entry_date", todayISO()),
  ]);
  const items = allItems.filter((i) => i.active);
  const par = await getParSuggestions(new Map(items.map((i) => [i.id, i.base_unit])));
  const suggestions = items.filter((i) => {
    const s = par.byItem.get(i.id);
    return s !== undefined && s !== i.par_level;
  }).length;

  const low = items.filter(belowPar).sort((a, b) => a.qty / (a.par_level || 1) - b.qty / (b.par_level || 1));
  const withPar = items.filter((i) => i.par_level !== null).length;
  const withStock = items.filter((i) => i.qty > 0).length;
  const stockValue = items.reduce((sum, i) => sum + Math.max(i.qty, 0) * (i.avg_cost ?? 0), 0);
  const activeSuppliers = suppliers.filter((s) => s.active).length;
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Dubai" });

  const setup = [
    { done: items.length > 0, text: `Items loaded (${items.length})`, href: "/stock/import" },
    { done: activeSuppliers > 0, text: `Suppliers added (${activeSuppliers})`, href: "/stock/suppliers" },
    { done: withStock > 0, text: `Opening stock entered (${withStock} of ${items.length})`, href: "/stock/import" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">{date}</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {greeting()}, {session?.name}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon="items" label="Items" value={String(items.length)} hint={`${withStock} in stock`} href="/stock/items?status=in" />
        <StatCard
          icon="alert"
          label="Below par level"
          value={String(low.length)}
          hint={withPar === 0 ? "Shown once par levels are suggested" : "Need buying soon"}
          href="/stock/items?below=1"
          tone={withPar === 0 ? "default" : low.length > 0 ? "warn" : "good"}
        />
        <StatCard
          icon="orders"
          label="Orders to approve"
          value={String(waiting.count ?? 0)}
          hint={manager ? "Waiting for a head" : "Sent for approval"}
          href="/stock/orders"
          tone={(waiting.count ?? 0) > 0 ? "warn" : "default"}
        />
        <StatCard
          icon="usage"
          label="Usage entries today"
          value={String(usedToday.count ?? 0)}
          hint={(usedToday.count ?? 0) === 0 ? "Nothing entered yet" : "Keep going"}
          href="/stock/usage"
        />
        {manager && (
          <StatCard
            icon="alert"
            label="New price rises"
            value={String(alerts.count ?? 0)}
            href="/stock/prices"
            tone={(alerts.count ?? 0) > 0 ? "warn" : "default"}
          />
        )}
        {manager ? (
          <StatCard icon="reports" label="Stock value" value={formatAed(stockValue)} hint="At average cost" />
        ) : (
          <StatCard icon="check" label="Usage records" value={`${Math.min(par.daysOfRecords, PAR_HISTORY_DAYS)} / ${PAR_HISTORY_DAYS}`} hint="days, for suggested par levels" />
        )}
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <QuickAction href="/stock/usage" icon="usage" label="Daily usage" text="Enter what was used or wasted" />
          <QuickAction href="/stock/bills/new" icon="bills" label="Enter a bill" text="Stock in from a supplier" />
          <QuickAction href="/stock/orders/new" icon="orders" label="New order" text="Send for approval" />
          <QuickAction href="/stock/count" icon="count" label="Stock check" text="Count the store" />
          <QuickAction href="/stock/items" icon="items" label="Find an item" text="Search stock by any name" />
          <QuickAction href="/stock/orders/new?fromPar=1" icon="alert" label="What to buy" text="Order items below par" />
          {manager && <QuickAction href="/stock/reports" icon="reports" label="Reports" text="Food cost and top items" />}
          {manager && <QuickAction href="/stock/prices" icon="alert" label="Prices" text="Rises and history" />}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <StockIcon name="alert" className="h-5 w-5 text-red-600" /> Running low
          </h2>
          {low.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {withPar === 0
                ? `Par levels are suggested from ${PAR_HISTORY_DAYS} days of daily usage records. After that, items running low show up here.`
                : "Nothing is below its par level."}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {low.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium">{item.name}</span>
                  <span className="shrink-0 text-right">
                    <span className="font-semibold text-red-600">
                      {formatQty(item.qty)} {item.base_unit}
                    </span>
                    <span className="text-muted"> / par {formatQty(item.par_level)}</span>
                  </span>
                </li>
              ))}
              {low.length > 8 && (
                <li className="pt-2 text-sm">
                  <Link href="/stock/items?below=1" className="font-semibold text-primary underline">
                    See all {low.length}
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>

        {manager && (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <StockIcon name="reports" className="h-5 w-5 text-primary" /> Suggested par levels
            </h2>
            {par.ready ? (
              <p className="mt-3 text-sm">
                {suggestions > 0 ? (
                  <>
                    <span className="font-semibold">{suggestions} suggestions ready</span>, based on the last {PAR_HISTORY_DAYS} days
                    of usage ({PAR_COVER_DAYS} days of cover).{" "}
                    <Link href="/stock/items" className="font-semibold text-primary underline">
                      Review them in Items
                    </Link>
                  </>
                ) : (
                  "All par levels match the latest usage."
                )}
              </p>
            ) : (
              <>
                <p className="mt-3 text-sm text-foreground/80">
                  Par levels are worked out from real usage, so there is nothing to fill in. After {PAR_HISTORY_DAYS} days of
                  daily usage records, each item gets a suggested par ({PAR_COVER_DAYS} days of its average use) for you to approve.
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (par.daysOfRecords / PAR_HISTORY_DAYS) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {par.daysOfRecords} of {PAR_HISTORY_DAYS} days recorded
                </p>
              </>
            )}
          </section>
        )}

        {manager && (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <StockIcon name="check" className="h-5 w-5 text-green-700" /> Getting set up
            </h2>
            <ul className="mt-3 space-y-2">
              {setup.map((step) => (
                <li key={step.text}>
                  <Link href={step.href} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-background">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.done ? "bg-green-600 text-white" : "border-2 border-border text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={step.done ? "text-muted line-through" : "font-medium"}>{step.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Tip: download the item list in Import / Export, fill in units, suppliers and opening stock in Excel, and import
              it back.
            </p>
          </section>
        )}
      </div>

    </div>
  );
}

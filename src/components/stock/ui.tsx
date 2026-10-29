"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatQty, itemMatches, type StockItem, type Supplier } from "@/lib/stock/types";

export const field =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";
export const label = "text-sm font-medium text-foreground/80";
export const btnPrimary =
  "rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";
export const btnOutline =
  "rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50";
export const btnDanger = "rounded-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50";
export const card = "rounded-2xl border border-border bg-surface";

export function PageTitle({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function LinkButton({ href, children, outline = false }: { href: string; children: ReactNode; outline?: boolean }) {
  return (
    <Link href={href} className={outline ? btnOutline : btnPrimary}>
      {children}
    </Link>
  );
}

export function Message({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <p className={`text-sm ${ok ? "text-green-700" : "text-red-600"}`}>{children}</p>;
}

export function StatusBadge({ status, label: text }: { status: string; label: string }) {
  const tone: Record<string, string> = {
    draft: "bg-border/60 text-foreground/80",
    submitted: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    received: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-border/60 text-muted line-through",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[status] ?? "bg-border/60"}`}>{text}</span>;
}

// Items and suppliers for the stock screens, loaded once per page.
export function useStockData() {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const [i, s] = await Promise.all([fetch("/api/admin/stock/items"), fetch("/api/admin/stock/suppliers")]);
    const itemsData = await i.json().catch(() => ({}));
    const suppliersData = await s.json().catch(() => ({}));
    if (!i.ok) setError(itemsData.error ?? "Could not load the items.");
    setItems(itemsData.items ?? []);
    setSuppliers(suppliersData.suppliers ?? []);
  }, []);
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);
  return { items, suppliers, error, reload: load };
}

// Search box that finds an item by name, brand, sub-category or old register name.
export function ItemPicker({
  items,
  onPick,
  placeholder = "Search an item to add...",
  exclude = [],
}: {
  items: StockItem[];
  onPick: (item: StockItem) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return items.filter((i) => i.active && !exclude.includes(i.id) && itemMatches(i, query)).slice(0, 12);
  }, [items, query, exclude]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`${field} mt-0 py-3 text-base`}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface shadow-lg">
          {matches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(item);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-background"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {[item.category, item.brand, item.pack_size].filter(Boolean).join(" - ")}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-muted">
                  {formatQty(item.qty)} {item.base_unit}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && matches.length === 0 && (
        <p className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted shadow-lg">
          No item found. A head can add it in Items.
        </p>
      )}
    </div>
  );
}

export function SupplierSelect({
  suppliers,
  value,
  onChange,
  required = false,
}: {
  suppliers: Supplier[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className={field}>
      <option value="">{required ? "Choose a supplier" : "No supplier"}</option>
      {suppliers
        .filter((s) => s.active || s.id === value)
        .map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
    </select>
  );
}

export async function postJson(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  UNITS,
  formatAed,
  formatQty,
  itemMatches,
  sortCategories,
  type ParInfo,
  type StockItem,
  type Supplier,
} from "@/lib/stock/types";

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";
const labelClass = "text-sm font-medium text-foreground/80";

type Draft = {
  name: string;
  category: string;
  sub_category: string;
  brand: string;
  pack_size: string;
  aliases: string;
  base_unit: string;
  purchase_unit: string;
  purchase_factor: string;
  par_level: string;
  reorder_qty: string;
  default_supplier_id: string;
  notes: string;
  active: boolean;
};

const emptyDraft: Draft = {
  name: "",
  category: "Dry Store",
  sub_category: "",
  brand: "",
  pack_size: "",
  aliases: "",
  base_unit: "pcs",
  purchase_unit: "",
  purchase_factor: "1",
  par_level: "",
  reorder_qty: "",
  default_supplier_id: "",
  notes: "",
  active: true,
};

function toDraft(item: StockItem): Draft {
  return {
    name: item.name,
    category: item.category,
    sub_category: item.sub_category ?? "",
    brand: item.brand ?? "",
    pack_size: item.pack_size ?? "",
    aliases: item.aliases ?? "",
    base_unit: item.base_unit,
    purchase_unit: item.purchase_unit ?? "",
    purchase_factor: String(item.purchase_factor),
    par_level: item.par_level === null ? "" : String(item.par_level),
    reorder_qty: item.reorder_qty === null ? "" : String(item.reorder_qty),
    default_supplier_id: item.default_supplier_id ?? "",
    notes: item.notes ?? "",
    active: item.active,
  };
}

const optionalNumber = (v: string) => (v.trim() === "" ? null : Number(v));

function toPayload(d: Draft) {
  return {
    name: d.name,
    category: d.category,
    sub_category: d.sub_category,
    brand: d.brand,
    pack_size: d.pack_size,
    aliases: d.aliases,
    base_unit: d.base_unit,
    purchase_unit: d.purchase_unit,
    purchase_factor: d.purchase_unit ? Number(d.purchase_factor || 1) : 1,
    par_level: optionalNumber(d.par_level),
    reorder_qty: optionalNumber(d.reorder_qty),
    default_supplier_id: d.default_supplier_id || null,
    notes: d.notes,
    active: d.active,
  };
}

function belowPar(item: StockItem) {
  return item.par_level !== null && item.qty < item.par_level;
}

export type StockStatus = "all" | "in" | "out" | "below" | "nopar" | "suggested";
type SortKey = "name" | "qty-desc" | "qty-asc" | "value-desc" | "cost-desc";

const STATUS_LABEL: Record<StockStatus, string> = {
  all: "All",
  in: "In stock",
  out: "Out of stock",
  below: "Below par",
  nopar: "No par level",
  suggested: "Has suggested par",
};

const NONE = "__none__";

function matchesStatus(item: StockItem, status: StockStatus) {
  switch (status) {
    case "in":
      return item.qty > 0;
    case "out":
      return item.qty <= 0;
    case "below":
      return belowPar(item);
    case "nopar":
      return item.par_level === null;
    case "suggested":
      return item.suggested_par != null && item.suggested_par !== item.par_level;
    default:
      return true;
  }
}

const distinct = (values: (string | null)[]) =>
  [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort((a, b) => a.localeCompare(b));

export default function ItemsManager({
  canManage,
  initialStatus = "all",
}: {
  canManage: boolean;
  initialStatus?: StockStatus;
}) {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showInactive, setShowInactive] = useState(false);
  const [status, setStatus] = useState<StockStatus>(initialStatus);
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [parInfo, setParInfo] = useState<ParInfo | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    const [itemsRes, suppliersRes] = await Promise.all([fetch("/api/admin/stock/items"), fetch("/api/admin/stock/suppliers")]);
    const itemsData = await itemsRes.json().catch(() => ({}));
    const suppliersData = await suppliersRes.json().catch(() => ({}));
    if (!itemsRes.ok) setError(itemsData.error ?? "Could not load the items.");
    setItems(itemsData.items ?? []);
    setParInfo(itemsData.parInfo ?? null);
    setSuppliers(suppliersData.suppliers ?? []);
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const categories = useMemo(() => sortCategories([...new Set((items ?? []).map((i) => i.category))]), [items]);

  // Options in the drop-downs follow the chosen category, so they only list what is there.
  const inCategory = useMemo(
    () => (items ?? []).filter((i) => (showInactive || i.active) && (category === "All" || i.category === category)),
    [items, showInactive, category]
  );
  const subCategories = useMemo(() => distinct(inCategory.map((i) => i.sub_category)), [inCategory]);
  const brands = useMemo(() => distinct(inCategory.map((i) => i.brand)), [inCategory]);
  const units = useMemo(() => distinct(inCategory.map((i) => i.base_unit)), [inCategory]);

  const visible = useMemo(() => {
    const value = (i: StockItem) => Math.max(i.qty, 0) * (i.avg_cost ?? 0);
    const list = inCategory.filter(
      (i) =>
        matchesStatus(i, status) &&
        (!subCategory || i.sub_category === subCategory) &&
        (!brand || i.brand === brand) &&
        (!unit || i.base_unit === unit) &&
        (!supplierId || (supplierId === NONE ? !i.default_supplier_id : i.default_supplier_id === supplierId)) &&
        itemMatches(i, query)
    );
    const by: Record<SortKey, (a: StockItem, b: StockItem) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      "qty-desc": (a, b) => b.qty - a.qty || a.name.localeCompare(b.name),
      "qty-asc": (a, b) => a.qty - b.qty || a.name.localeCompare(b.name),
      "value-desc": (a, b) => value(b) - value(a) || a.name.localeCompare(b.name),
      "cost-desc": (a, b) => (b.avg_cost ?? 0) - (a.avg_cost ?? 0) || a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort]);
  }, [inCategory, status, subCategory, brand, unit, supplierId, query, sort]);

  // Sorted by name the list is grouped by category; any other order is one list, highest first.
  const grouped = useMemo(() => {
    if (sort !== "name") return [{ category: "", items: visible }];
    const map = new Map<string, StockItem[]>();
    for (const item of visible) map.set(item.category, [...(map.get(item.category) ?? []), item]);
    return sortCategories([...map.keys()]).map((c) => ({ category: c, items: map.get(c)! }));
  }, [visible, sort]);

  const extraFilters = [subCategory, brand, unit, supplierId].filter(Boolean).length;
  const filtersOn = extraFilters > 0 || status !== "all" || category !== "All" || query.trim() !== "" || sort !== "name";
  function clearFilters() {
    setQuery("");
    setCategory("All");
    setStatus("all");
    setSubCategory("");
    setBrand("");
    setUnit("");
    setSupplierId("");
    setSort("name");
  }
  function chooseCategory(c: string) {
    setCategory(c);
    setSubCategory("");
    setBrand("");
    setUnit("");
  }

  const pending = (items ?? []).filter(
    (i) => i.active && i.suggested_par !== null && i.suggested_par !== undefined && i.suggested_par !== i.par_level
  );

  async function applyAll() {
    if (!confirm(`Set the suggested par level on ${pending.length} items?`)) return;
    setApplying(true);
    const res = await fetch("/api/admin/stock/par", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: pending.map((i) => i.id) }),
    });
    const data = await res.json().catch(() => ({}));
    setApplying(false);
    if (!res.ok) setError(data.error ?? "Could not set the par levels.");
    await load();
  }

  if (items === null) return <p className="text-sm text-muted">Loading items...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items, brands, old names..."
          className={`${fieldClass} mt-0 max-w-md flex-1`}
        />
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setOpenId(null);
            }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            + Add item
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => chooseCategory(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              category === c ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/80 hover:text-primary"
            }`}
          >
            {c}
            {c !== "All" && <span className="ml-1 opacity-70">{items.filter((i) => i.category === c && i.active).length}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Stock">
        {(Object.keys(STATUS_LABEL) as StockStatus[])
          .filter((st) => canManage || st !== "suggested")
          .map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatus(st)}
              aria-pressed={status === st}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                status === st
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground/80 hover:border-primary"
              }`}
            >
              {STATUS_LABEL[st]}
              <span className="ml-1 opacity-70">{inCategory.filter((i) => matchesStatus(i, st)).length}</span>
            </button>
          ))}
      </div>

      {/* Left uncontrolled so it stays open while filters are changed. */}
      <details className="rounded-2xl border border-border bg-surface p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          More filters and sorting{extraFilters > 0 ? ` (${extraFilters} on)` : ""}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>
            Sub-category
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className={fieldClass}>
              <option value="">All</option>
              {subCategories.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Brand
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={fieldClass}>
              <option value="">All</option>
              {brands.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Unit
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={fieldClass}>
              <option value="">All</option>
              {units.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Supplier
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={fieldClass}>
              <option value="">All</option>
              <option value={NONE}>No supplier set</option>
              {suppliers.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={fieldClass}>
              <option value="name">Name (A-Z, by category)</option>
              <option value="qty-desc">Most in stock first</option>
              <option value="qty-asc">Least in stock first</option>
              {canManage && <option value="value-desc">Highest stock value first</option>}
              {canManage && <option value="cost-desc">Most expensive first</option>}
            </select>
          </label>
          {canManage && (
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
              Show switched-off items
            </label>
          )}
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium">{visible.length} items</span>
        {filtersOn && (
          <button type="button" onClick={clearFilters} className="font-semibold text-primary underline">
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canManage && parInfo && (
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          {parInfo.ready ? (
            pending.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  <span className="font-semibold">{pending.length} suggested par levels</span> from the last{" "}
                  {parInfo.historyDays} days of usage ({parInfo.coverDays} days of cover). Tap an item to check it, or apply
                  them all.
                </p>
                <button
                  type="button"
                  onClick={applyAll}
                  disabled={applying}
                  className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {applying ? "Saving..." : "Apply all suggestions"}
                </button>
              </div>
            ) : (
              <p>Par levels match the latest {parInfo.historyDays} days of usage.</p>
            )
          ) : (
            <p className="text-muted">
              Par levels will be suggested automatically after {parInfo.historyDays} days of daily usage records (
              {parInfo.daysOfRecords} of {parInfo.historyDays} so far). You can still set one by hand if you want.
            </p>
          )}
        </div>
      )}

      {adding && (
        <ItemForm
          title="New item"
          initial={emptyDraft}
          categories={categories}
          suppliers={suppliers}
          onCancel={() => setAdding(false)}
          onSave={async (draft) => {
            const res = await fetch("/api/admin/stock/items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(toPayload(draft)),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return data.error ?? "Could not add the item.";
            setAdding(false);
            await load();
            setOpenId(data.id);
            return null;
          }}
        />
      )}

      {grouped.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          {items.length === 0 ? "No items yet. Import your Excel list from Import / Export." : "No items match."}
        </p>
      ) : (
        grouped.map((group) => (
          <section key={group.category}>
            {group.category && (
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted">{group.category}</h2>
            )}
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${item.active ? "" : "opacity-50"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {[item.sub_category, item.brand, item.pack_size].filter(Boolean).join(" - ") || " "}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={`block font-semibold ${belowPar(item) ? "text-red-600" : ""}`}>
                        {formatQty(item.qty)} {item.base_unit}
                      </span>
                      <span className="block text-xs text-muted">
                        {item.par_level !== null ? `par ${formatQty(item.par_level)}` : "no par"}
                        {canManage && item.suggested_par != null && item.suggested_par !== item.par_level
                          ? ` - suggested ${formatQty(item.suggested_par)}`
                          : ""}
                        {canManage && item.avg_cost ? ` - ${formatAed(item.avg_cost)}/${item.base_unit}` : ""}
                      </span>
                    </span>
                  </button>
                  {openId === item.id &&
                    (canManage ? (
                      <ManageItem item={item} categories={categories} suppliers={suppliers} onChanged={load} onClose={() => setOpenId(null)} />
                    ) : (
                      <ItemDetails item={item} suppliers={suppliers} />
                    ))}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function ItemDetails({ item, suppliers }: { item: StockItem; suppliers: Supplier[] }) {
  const supplier = suppliers.find((s) => s.id === item.default_supplier_id);
  const rows: [string, string][] = [
    ["In stock", `${formatQty(item.qty)} ${item.base_unit}`],
    ["Par level", item.par_level !== null ? `${formatQty(item.par_level)} ${item.base_unit}` : "-"],
    ["Bought as", item.purchase_unit ? `${item.purchase_unit} of ${formatQty(item.purchase_factor)} ${item.base_unit}` : item.base_unit],
    ["Supplier", supplier?.name ?? "-"],
    ["Also known as", item.aliases ?? "-"],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-2 border-t border-border bg-background/60 px-4 py-4 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ManageItem({
  item,
  categories,
  suppliers,
  onChanged,
  onClose,
}: {
  item: StockItem;
  categories: string[];
  suppliers: Supplier[];
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 border-t border-border bg-background/60 px-4 py-4">
      {!item.has_movements && <OpeningStockForm item={item} onSaved={onChanged} />}
      {item.suggested_par != null && item.suggested_par !== item.par_level && (
        <SuggestedPar item={item} onSaved={onChanged} />
      )}
      <ItemForm
        title="Edit item"
        initial={toDraft(item)}
        categories={categories}
        suppliers={suppliers}
        onCancel={onClose}
        onSave={async (draft) => {
          const res = await fetch(`/api/admin/stock/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toPayload(draft)),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return data.error ?? "Could not save.";
          await onChanged();
          return null;
        }}
      />
    </div>
  );
}

function SuggestedPar({ item, onSaved }: { item: StockItem; onSaved: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  async function apply() {
    setMessage("");
    const res = await fetch("/api/admin/stock/par", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: [item.id] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setMessage(data.error ?? "Could not save.");
    else await onSaved();
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <p>
        Suggested par level: <span className="font-semibold">{formatQty(item.suggested_par)} {item.base_unit}</span>
        {item.par_level !== null && <span className="text-muted"> (now {formatQty(item.par_level)})</span>}
      </p>
      <button type="button" onClick={apply} className="rounded-full bg-primary px-4 py-1.5 font-semibold text-primary-foreground">
        Use this
      </button>
      {message && <p className="w-full text-red-600">{message}</p>}
    </div>
  );
}

function OpeningStockForm({ item, onSaved }: { item: StockItem; onSaved: () => Promise<void> }) {
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState(item.avg_cost ? String(item.avg_cost) : "");
  const [message, setMessage] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch(`/api/admin/stock/items/${item.id}/opening`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: Number(qty || 0), unit_cost: Number(cost || 0) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setMessage(data.error ?? "Could not save.");
    else await onSaved();
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-accent/40 bg-accent/10 p-3">
      <p className="text-sm font-semibold">Opening stock (first setup only)</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className={labelClass}>
          Quantity ({item.base_unit})
          <input type="number" min={0} step="any" required value={qty} onChange={(e) => setQty(e.target.value)} className={`${fieldClass} w-32`} />
        </label>
        <label className={labelClass}>
          Cost per {item.base_unit} (AED)
          <input type="number" min={0} step="any" value={cost} onChange={(e) => setCost(e.target.value)} className={`${fieldClass} w-32`} />
        </label>
        <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Set opening stock
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </form>
  );
}

function ItemForm({
  title,
  initial,
  categories,
  suppliers,
  onSave,
  onCancel,
}: {
  title: string;
  initial: Draft;
  categories: string[];
  suppliers: Supplier[];
  onSave: (draft: Draft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const categoryOptions = sortCategories([...new Set([...categories, draft.category])]);
  const unitOptions = [...new Set([...UNITS, draft.base_unit])];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const error = await onSave(draft);
    setBusy(false);
    setMessage(error ? { ok: false, text: error } : { ok: true, text: "Saved." });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <p className="font-display font-semibold">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          Name
          <input required maxLength={120} value={draft.name} onChange={(e) => set("name", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Category
          <input list="stock-categories" required maxLength={60} value={draft.category} onChange={(e) => set("category", e.target.value)} className={fieldClass} />
          <datalist id="stock-categories">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className={labelClass}>
          Sub-category
          <input maxLength={60} value={draft.sub_category} onChange={(e) => set("sub_category", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Brand / variant
          <input maxLength={80} value={draft.brand} onChange={(e) => set("brand", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Size / pack
          <input maxLength={60} value={draft.pack_size} onChange={(e) => set("pack_size", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Base unit (how you count and use it)
          <select value={draft.base_unit} onChange={(e) => set("base_unit", e.target.value)} className={fieldClass}>
            {unitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Bought as
            <select value={draft.purchase_unit} onChange={(e) => set("purchase_unit", e.target.value)} className={fieldClass}>
              <option value="">same unit</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {draft.base_unit} per {draft.purchase_unit || "unit"}
            <input
              type="number"
              min={0.0001}
              step="any"
              required
              disabled={!draft.purchase_unit}
              value={draft.purchase_unit ? draft.purchase_factor : "1"}
              onChange={(e) => set("purchase_factor", e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          Par level ({draft.base_unit}, optional - suggested after a month)
          <input type="number" min={0} step="any" value={draft.par_level} onChange={(e) => set("par_level", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Usual order qty ({draft.base_unit}, optional)
          <input type="number" min={0} step="any" value={draft.reorder_qty} onChange={(e) => set("reorder_qty", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Usual supplier
          <select value={draft.default_supplier_id} onChange={(e) => set("default_supplier_id", e.target.value)} className={fieldClass}>
            <option value="">-</option>
            {suppliers
              .filter((s) => s.active || s.id === draft.default_supplier_id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <label className={labelClass}>
          Also search as (old names, separated by |)
          <input maxLength={500} value={draft.aliases} onChange={(e) => set("aliases", e.target.value)} className={fieldClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Notes
          <input maxLength={500} value={draft.notes} onChange={(e) => set("notes", e.target.value)} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Active (untick to hide an item you no longer use)
        </label>
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
      <div className="flex gap-4">
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-primary">
          Close
        </button>
      </div>
    </form>
  );
}

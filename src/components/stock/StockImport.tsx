"use client";

import { useState } from "react";

type SheetPreview = {
  name: string;
  recommended: boolean;
  count: number;
  newCount: number;
  problems: string[];
  sample: { name: string; category: string; sub_category?: string; base_unit?: string; brand?: string }[];
};

type ImportResult = { created: number; updated: number; opening: number; skippedOpening: string[] };

export default function StockImport() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetPreview[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function send(mode: "preview" | "import", selected: File) {
    const form = new FormData();
    form.append("file", selected);
    form.append("mode", mode);
    form.append("sheets", JSON.stringify(chosen));
    const res = await fetch("/api/admin/stock/import", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
  }

  async function handleFile(selected: File | null) {
    setFile(selected);
    setSheets(null);
    setResult(null);
    setError("");
    if (!selected) return;
    setBusy(true);
    try {
      const data = await send("preview", selected);
      setSheets(data.sheets);
      setChosen(data.sheets.filter((s: SheetPreview) => s.recommended).map((s: SheetPreview) => s.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await send("import", file);
      setResult(data.result);
      setSheets(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The import failed.");
    } finally {
      setBusy(false);
    }
  }

  const total = (sheets ?? []).filter((s) => chosen.includes(s.name)).reduce((n, s) => n + s.count, 0);
  const totalNew = (sheets ?? []).filter((s) => chosen.includes(s.name)).reduce((n, s) => n + s.newCount, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">1. Download the item list</h2>
        <p className="mt-1 text-sm text-foreground/80">
          An Excel file of every item. Fill in base unit, purchase unit, par level, supplier, cost and opening stock, then
          import it below. Empty cells are ignored, so you can do it in several rounds.
        </p>
        <a
          href="/api/admin/stock/export"
          className="mt-4 inline-block rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          Download items (Excel)
        </a>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">2. Import an Excel file</h2>
        <p className="mt-1 text-sm text-foreground/80">
          Your Food Stock List or the file from step 1. Items are matched by name: existing items are updated, new names
          are added. Nothing is saved until you press Import.
        </p>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="mt-4 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
        />
        {busy && <p className="mt-3 text-sm text-muted">Working...</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {sheets && (
          <div className="mt-5 space-y-4">
            <p className="text-sm font-semibold">Choose which sheets to import</p>
            {sheets.map((sheet) => (
              <div key={sheet.name} className="rounded-xl border border-border bg-background p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={chosen.includes(sheet.name)}
                    onChange={(e) =>
                      setChosen((c) => (e.target.checked ? [...c, sheet.name] : c.filter((n) => n !== sheet.name)))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="font-medium">{sheet.name}</span>
                  <span className="text-sm text-muted">
                    {sheet.count} items ({sheet.newCount} new, {sheet.count - sheet.newCount} to update)
                  </span>
                </label>
                <ul className="mt-2 space-y-0.5 pl-7 text-xs text-muted">
                  {sheet.sample.map((row) => (
                    <li key={row.name}>
                      {row.name} - {row.category}
                      {row.sub_category ? ` / ${row.sub_category}` : ""}
                      {row.base_unit ? ` - unit ${row.base_unit}` : ""}
                    </li>
                  ))}
                  {sheet.count > sheet.sample.length && <li>...and {sheet.count - sheet.sample.length} more</li>}
                </ul>
                {sheet.problems.length > 0 && (
                  <details className="mt-2 pl-7 text-xs text-amber-700">
                    <summary className="cursor-pointer">{sheet.problems.length} rows need a look</summary>
                    <ul className="mt-1 space-y-0.5">
                      {sheet.problems.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleImport}
              disabled={busy || chosen.length === 0}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              Import {total} items ({totalNew} new)
            </button>
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-xl border border-green-600/40 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">Import finished</p>
            <p className="mt-1">
              {result.created} new items, {result.updated} updated
              {result.opening > 0 ? `, opening stock or cost set for ${result.opening}` : ""}.
            </p>
            {result.skippedOpening.length > 0 && (
              <p className="mt-2 text-amber-800">
                Opening stock was not changed for {result.skippedOpening.length} items that already have stock entries (use
                a stock check for those): {result.skippedOpening.slice(0, 10).join(", ")}
                {result.skippedOpening.length > 10 ? "..." : ""}
              </p>
            )}
            <a href="/stock/items" className="mt-3 inline-block font-semibold underline">
              Go to items
            </a>
          </div>
        )}
      </section>
    </div>
  );
}

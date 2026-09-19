"use client";

import { useRef, useState } from "react";
import { todayISO } from "@/lib/date";
import type { MenuItem } from "@/lib/types";

type ImportedMenu = { date: string; items: MenuItem[]; source: string };
type Status = "idle" | "parsing" | "importing" | "done" | "error";

function weekday(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export default function MenuUploader() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [menus, setMenus] = useState<ImportedMenu[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const today = todayISO();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("parsing");
    setMessage("");
    setMenus([]);
    setWarnings([]);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/menu/import", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not read that file.");
    } else {
      setMenus(data.menus);
      setWarnings(data.warnings ?? []);
      setSelected(new Set(data.menus.filter((m: ImportedMenu) => m.date >= today).map((m: ImportedMenu) => m.date)));
      setStatus("idle");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggle(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  async function handleImport() {
    const chosen = menus.filter((m) => selected.has(m.date));
    setStatus("importing");
    setMessage("");

    const res = await fetch("/api/admin/menu/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menus: chosen.map(({ date, items }) => ({ date, items })) }),
    });

    if (res.ok) {
      setStatus("done");
      setMessage(`Imported ${chosen.length} menu${chosen.length === 1 ? "" : "s"}. Customers can see them now.`);
      setMenus([]);
      setSelected(new Set());
    } else {
      setStatus("error");
      setMessage("Import failed. Nothing was saved - please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-foreground/80">
          Upload your menu sheet (<strong>.xlsx</strong> or <strong>.csv</strong>) with one column per day: the date on
          top, then each section heading (Starter, Soup, Main Course, Dessert, Drinks, Ice Cream...) followed by its
          dishes. Every day found in the file can be imported at once.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="cursor-pointer rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {status === "parsing" ? "Reading file..." : "Choose file"}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFile}
              disabled={status === "parsing" || status === "importing"}
            />
          </label>
          <a href="/api/admin/menu/template?format=xlsx" className="text-sm font-semibold text-primary hover:underline">
            Download Excel template
          </a>
          <a href="/api/admin/menu/template?format=csv" className="text-sm font-semibold text-primary hover:underline">
            Download CSV template
          </a>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}
      {warnings.map((w) => (
        <p key={w} className="rounded-md bg-accent/15 px-3 py-2 text-sm text-foreground/80">
          {w}
        </p>
      ))}

      {menus.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-display text-lg font-semibold">
              Found {menus.length} day{menus.length === 1 ? "" : "s"} - review and import
            </h2>
            <button
              type="button"
              onClick={() => setSelected(new Set(menus.filter((m) => m.date >= today).map((m) => m.date)))}
              className="text-sm font-medium text-primary hover:underline"
            >
              Upcoming only
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set(menus.map((m) => m.date)))}
              className="text-sm font-medium text-primary hover:underline"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-muted hover:text-primary"
            >
              None
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {menus.map((menu) => {
              const categories = Array.from(new Set(menu.items.map((i) => i.category)));
              const isPast = menu.date < today;
              return (
                <li key={menu.date} className="rounded-lg border border-border bg-surface">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(menu.date)}
                      onChange={() => toggle(menu.date)}
                      aria-label={`Import ${menu.date}`}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <span className="font-medium">{weekday(menu.date)}</span>
                    {isPast && <span className="text-xs text-muted">(past date)</span>}
                    <span className="text-sm text-muted">
                      {menu.items.length} dishes · {categories.length} sections
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === menu.date ? null : menu.date)}
                      className="ml-auto text-sm font-medium text-primary hover:underline"
                    >
                      {expanded === menu.date ? "Hide" : "Preview"}
                    </button>
                  </div>
                  {expanded === menu.date && (
                    <div className="space-y-3 border-t border-border px-4 py-3 text-sm">
                      {categories.map((category) => (
                        <div key={category}>
                          <p className="font-semibold text-primary">{category}</p>
                          <p className="text-foreground/80">
                            {menu.items
                              .filter((i) => i.category === category)
                              .map((i) => i.name)
                              .join(" · ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleImport}
              disabled={selected.size === 0 || status === "importing"}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {status === "importing" ? "Importing..." : `Import ${selected.size} selected`}
            </button>
            <span className="text-xs text-muted">Existing menus for the selected dates will be replaced.</span>
          </div>
        </div>
      )}
    </div>
  );
}

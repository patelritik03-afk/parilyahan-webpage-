"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/date";
import { MENU_SECTIONS, groupsToItems, itemsToGroups, type MenuGroup } from "@/lib/menuSections";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const OTHER = "__other__";
const inputClass = "rounded-md border border-border bg-background px-3 py-2 text-sm";

export default function MenuEditor() {
  const [date, setDate] = useState(todayISO());
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.resolve()
      .then(() => setLoading(true))
      .then(() => fetch(`/api/admin/menu?date=${date}`))
      .then((res) => res.json())
      .then((data) => setGroups(itemsToGroups(data.items ?? [])))
      .finally(() => setLoading(false));
  }, [date]);

  function updateGroup(index: number, patch: Partial<MenuGroup>) {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function updateDish(gi: number, di: number, patch: Partial<MenuGroup["dishes"][number]>) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, dishes: g.dishes.map((d, j) => (j === di ? { ...d, ...patch } : d)) } : g
      )
    );
  }

  function addDish(gi: number) {
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, dishes: [...g.dishes, { name: "", description: "" }] } : g))
    );
  }

  function removeDish(gi: number, di: number) {
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, dishes: g.dishes.filter((_, j) => j !== di) } : g))
    );
  }

  function addGroup() {
    const used = new Set(groups.map((g) => g.category));
    const next = MENU_SECTIONS.find((s) => !used.has(s)) ?? "";
    setGroups((prev) => [...prev, { category: next, dishes: [{ name: "", description: "" }] }]);
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setMessage("");
    const filled = groups.filter((g) => g.dishes.some((d) => d.name.trim()));
    if (filled.some((g) => !g.category.trim())) {
      setSaveStatus("error");
      setMessage("Choose or type a section name for every group that has dishes.");
      return;
    }

    setSaveStatus("saving");
    const items = groupsToItems(filled);
    const res = await fetch("/api/admin/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, items }),
    });

    if (res.ok) {
      setGroups(itemsToGroups(items));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
      setMessage("Failed to save.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80" htmlFor="menu-date">
            Editing menu for
          </label>
          <input
            id="menu-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        {date === todayISO() && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Today</span>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Loading menu...</p>
      ) : (
        <>
          {groups.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              No menu for this date yet. Add a section to start.
            </p>
          )}

          <div className="space-y-5">
            {groups.map((group, gi) => {
              const isPreset = (MENU_SECTIONS as readonly string[]).includes(group.category);
              const selectValue = isPreset ? group.category : OTHER;
              return (
                <div key={gi} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      aria-label="Section"
                      value={selectValue}
                      onChange={(e) => updateGroup(gi, { category: e.target.value === OTHER ? "" : e.target.value })}
                      className={`${inputClass} font-semibold`}
                    >
                      {MENU_SECTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value={OTHER}>Other (type your own)...</option>
                    </select>
                    {!isPreset && (
                      <input
                        aria-label="Custom section name"
                        placeholder="Section name"
                        value={group.category}
                        onChange={(e) => updateGroup(gi, { category: e.target.value })}
                        className={`${inputClass} flex-1`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeGroup(gi)}
                      className="ml-auto rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove section
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {group.dishes.map((dish, di) => (
                      <div key={di} className="grid gap-2 sm:grid-cols-[2fr_2fr_auto]">
                        <input
                          placeholder="Dish name"
                          value={dish.name}
                          onChange={(e) => updateDish(gi, di, { name: e.target.value })}
                          className={inputClass}
                        />
                        <input
                          placeholder="Description (optional)"
                          value={dish.description}
                          onChange={(e) => updateDish(gi, di, { description: e.target.value })}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeDish(gi, di)}
                          className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addDish(gi)}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    + Add dish
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={addGroup}
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
            >
              + Add Section
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saveStatus === "saving" ? "Saving..." : `Save Menu for ${date}`}
            </button>
            {saveStatus === "saved" && <span className="text-sm text-green-600">Saved!</span>}
            {saveStatus === "error" && <span className="text-sm text-red-600">{message}</span>}
          </div>
        </>
      )}
    </div>
  );
}

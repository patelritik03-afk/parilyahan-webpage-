"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { todayISO } from "@/lib/date";
import { MAX_TAGS, TAGS_PER_PAGE } from "@/lib/nameTags";
import NameTagSheet from "./NameTagSheet";

type Tag = { id: string; text: string; on: boolean };
type Section = { category: string; tags: Tag[] };

const EXTRA = "Extra tags";
const inputClass = "rounded-md border border-border bg-background px-3 py-1.5 text-sm";
const buttonClass =
  "rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-50";

let counter = 0;
const nextId = () => `tag-${counter++}`;

export default function NameTagsManager({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError("");
        return fetch(`/api/admin/name-tags?date=${date}`);
      })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setSections(
          (data.sections ?? []).map((s: { category: string; tags: string[] }) => ({
            category: s.category,
            tags: s.tags.map((text) => ({ id: nextId(), text, on: true })),
          }))
        );
      })
      .catch(() => !cancelled && setError("Could not load the menu."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [date]);

  const selected = useMemo(
    () => sections.flatMap((s) => s.tags.filter((t) => t.on && t.text.trim()).map((t) => t.text.trim())),
    [sections]
  );
  const pageCount = Math.ceil(selected.length / TAGS_PER_PAGE);

  function updateTag(sectionIndex: number, id: string, patch: Partial<Tag>) {
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIndex ? { ...s, tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) } : s))
    );
  }

  function setSectionOn(sectionIndex: number, on: boolean) {
    setSections((prev) => prev.map((s, i) => (i === sectionIndex ? { ...s, tags: s.tags.map((t) => ({ ...t, on })) } : s)));
  }

  function removeTag(sectionIndex: number, id: string) {
    setSections((prev) =>
      prev
        .map((s, i) => (i === sectionIndex ? { ...s, tags: s.tags.filter((t) => t.id !== id) } : s))
        .filter((s) => s.tags.length > 0)
    );
  }

  function addTag(e: FormEvent) {
    e.preventDefault();
    const text = newTag.trim();
    if (!text) return;
    setSections((prev) => {
      const tag = { id: nextId(), text, on: true };
      const index = prev.findIndex((s) => s.category === EXTRA);
      if (index === -1) return [...prev, { category: EXTRA, tags: [tag] }];
      return prev.map((s, i) => (i === index ? { ...s, tags: [...s.tags, tag] } : s));
    });
    setNewTag("");
  }

  async function handleDownload() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/name-tags/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, tags: selected }),
      });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `name-tags-${date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not create the file. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handlePrint() {
    document.body.classList.add("psk-printing");
    const done = () => {
      document.body.classList.remove("psk-printing");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  const noneSelected = selected.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80" htmlFor="tag-date">
            Name tags for the menu of
          </label>
          <input
            id="tag-date"
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        {date === todayISO() && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Today</span>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Reading the menu...</p>
      ) : (
        <>
          {sections.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              No menu is saved for this date yet. Add it in the Menu tab, or add your own tags below.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((section, si) => (
              <div key={section.category} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display font-semibold text-primary">{section.category}</h2>
                  <span className="flex gap-3 text-xs font-medium">
                    <button type="button" onClick={() => setSectionOn(si, true)} className="text-primary hover:underline">
                      All
                    </button>
                    <button type="button" onClick={() => setSectionOn(si, false)} className="text-muted hover:text-primary">
                      None
                    </button>
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {section.tags.map((tag) => (
                    <li key={tag.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tag.on}
                        onChange={(e) => updateTag(si, tag.id, { on: e.target.checked })}
                        aria-label={`Print ${tag.text}`}
                        className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <input
                        value={tag.text}
                        maxLength={120}
                        onChange={(e) => updateTag(si, tag.id, { text: e.target.value })}
                        className={`${inputClass} min-w-0 flex-1 ${tag.on ? "" : "opacity-50"}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeTag(si, tag.id)}
                        aria-label={`Remove ${tag.text}`}
                        className="shrink-0 px-2 text-lg leading-none text-red-600 hover:bg-red-50"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <form onSubmit={addTag} className="flex max-w-xl flex-wrap items-center gap-3">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              maxLength={120}
              placeholder="Add a tag of your own, e.g. Lemon Ice Tea"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <button type="submit" className={buttonClass}>
              Add tag
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <span className="text-sm text-muted">
              {selected.length} tag{selected.length === 1 ? "" : "s"} selected
              {pageCount > 0 && ` - ${pageCount} A4 page${pageCount === 1 ? "" : "s"}`}
              {selected.length > MAX_TAGS && ` (only the first ${MAX_TAGS} can be exported)`}
            </span>
            <div className="ml-auto flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={busy || noneSelected}
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Creating file..." : "Download Excel file"}
              </button>
              <button type="button" onClick={handlePrint} disabled={noneSelected} className={buttonClass}>
                Print name tags
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!noneSelected && (
            <div>
              <h2 className="font-display text-lg font-semibold">Preview (first page)</h2>
              <p className="mt-1 text-xs text-muted">
                In the print window choose your printer, or &ldquo;Save as PDF&rdquo;. Keep the scale at 100% and turn
                headers and footers off.
              </p>
              <div
                className="mt-3 overflow-hidden rounded-md border border-border bg-white shadow-sm"
                style={{ width: "calc(210mm * 0.45)", height: "calc(297mm * 0.45)" }}
              >
                <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: "210mm" }}>
                  <NameTagSheet tags={selected} maxPages={1} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {mounted &&
        createPortal(
          <div className="psk-print-root">
            <NameTagSheet tags={selected} />
          </div>,
          document.body
        )}
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { translations, type Lang } from "@/lib/i18n/translations";
import type { AboutOverride } from "@/lib/aboutContent";

type Draft = { title: string; body: string };
type Drafts = Record<Lang, Draft>;

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:border-primary focus:outline-none";

const LANGS: { lang: Lang; label: string }[] = [
  { lang: "en", label: "English" },
  { lang: "tl", label: "Tagalog" },
];

function defaultDraft(lang: Lang): Draft {
  const t = translations[lang];
  return { title: t["about.title"], body: [t["about.p1"], t["about.p2"]].join("\n\n") };
}

function toDrafts(content: AboutOverride): Drafts {
  const pick = (lang: Lang): Draft => {
    const saved = content[lang];
    return saved ? { title: saved.title, body: saved.paragraphs.join("\n\n") } : defaultDraft(lang);
  };
  return { en: pick("en"), tl: pick("tl") };
}

const toPayload = (draft: Draft) => ({
  title: draft.title,
  paragraphs: draft.body.split(/\n\s*\n/),
});

export default function AboutManager() {
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/about")
      .then((res) => res.json())
      .then((data) => setDrafts(toDrafts(data.content ?? {})))
      .catch(() => setDrafts(toDrafts({})));
  }, []);

  if (!drafts) return <p className="text-sm text-muted">Loading...</p>;

  function update(lang: Lang, field: keyof Draft, value: string) {
    setDrafts((current) => (current ? { ...current, [lang]: { ...current[lang], [field]: value } } : current));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!drafts) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en: toPayload(drafts.en), tl: toPayload(drafts.tl) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(
      res.ok
        ? { ok: true, text: "Saved. The About Us page is updated." }
        : { ok: false, text: data.error ?? "Could not save." }
    );
  }

  async function handleReset() {
    if (!confirm("Go back to the original About Us text? Your edits will be removed.")) return;
    const res = await fetch("/api/admin/about", { method: "DELETE" });
    if (res.ok) {
      setDrafts(toDrafts({}));
      setMessage({ ok: true, text: "Original text restored." });
    } else {
      setMessage({ ok: false, text: "Could not reset." });
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {LANGS.map(({ lang, label }) => (
        <section key={lang} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">{label}</h2>
          <div>
            <label className="block text-sm font-medium text-foreground/80" htmlFor={`title-${lang}`}>
              Page title
            </label>
            <input id={`title-${lang}`} required maxLength={120} value={drafts[lang].title}
              onChange={(e) => update(lang, "title", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80" htmlFor={`body-${lang}`}>
              Story (leave an empty line between paragraphs)
            </label>
            <textarea id={`body-${lang}`} required rows={12} value={drafts[lang].body}
              onChange={(e) => update(lang, "body", e.target.value)} className={inputClass} />
          </div>
        </section>
      ))}

      {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={handleReset} className="text-sm font-medium text-muted hover:text-primary">
          Restore original text
        </button>
      </div>
    </form>
  );
}

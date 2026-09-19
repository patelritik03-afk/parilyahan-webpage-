"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { GoogleStatus } from "@/lib/reviews";

type ManualReview = {
  id: string;
  author_name: string;
  review_text: string;
  when_text: string | null;
  visible: boolean;
};

type Payload = {
  manual: ManualReview[];
  google: GoogleStatus;
  writeUrl: string;
  listingUrl: string;
};

const inputClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

function Stars() {
  return <span className="text-accent" aria-label="5 stars">★★★★★</span>;
}

export default function ReviewsManager() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load(refresh = false) {
    return fetch(`/api/admin/reviews${refresh ? "?refresh=1" : ""}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, []);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: values.author, text: values.text, when: values.when }),
    });
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      form.reset();
      setMessage("Review added - it now appears on the home page.");
      await load();
    } else {
      setMessage(body.error ?? "Could not save the review.");
    }
    setSaving(false);
  }

  async function toggleVisible(review: ManualReview) {
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !review.visible }),
    });
    await load();
  }

  async function remove(review: ManualReview) {
    if (!window.confirm(`Delete the review by ${review.author_name}?`)) return;
    await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
    await load();
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  if (loading || !data) return <p className="text-muted">Loading...</p>;

  const { google, manual, writeUrl } = data;

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Google connection</h2>
        {!google.configured ? (
          <p className="mt-2 text-sm text-foreground/80">
            <strong>Not connected yet.</strong> Reviews from Google are not pulled in automatically. Add{" "}
            <code className="rounded bg-background px-1">GOOGLE_PLACES_API_KEY</code> in the site settings (see the
            README) to show your 5-star Google reviews on the home page. Until then, use the manual list below.
          </p>
        ) : google.error ? (
          <p className="mt-2 text-sm text-red-600">Connected, but Google returned an error: {google.error}</p>
        ) : (
          <p className="mt-2 text-sm text-foreground/80">
            <strong className="text-green-700">Connected.</strong> Google rating{" "}
            <strong>{google.rating?.toFixed(1) ?? "-"}</strong> from <strong>{google.total ?? 0}</strong> reviews.{" "}
            {google.reviews.length} five-star review{google.reviews.length === 1 ? "" : "s"} shown automatically
            (Google shares only its most relevant few). Refreshes every few hours.
          </p>
        )}
        {google.configured && (
          <button
            type="button"
            onClick={() => load(true)}
            className="mt-3 text-sm font-semibold text-primary hover:underline"
          >
            Refresh from Google now
          </button>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">&quot;Write a review&quot; link</h2>
        <p className="mt-1 text-sm text-muted">
          This is the link behind the website&apos;s review button. Share it in WhatsApp or on receipts to collect more
          Google reviews.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input readOnly value={writeUrl} className={`${inputClass} mt-0 min-w-0 flex-1`} aria-label="Review link" />
          <button
            type="button"
            onClick={() => copyLink(writeUrl)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={writeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Open
          </a>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Add a 5-star review by hand</h2>
        <p className="mt-1 text-sm text-muted">
          Copy a genuine 5-star review from your Google Business Profile so it shows on the website. Only add real
          reviews from real guests.
        </p>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 rounded-lg border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="author">
                Reviewer name
              </label>
              <input id="author" name="author" required maxLength={100} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="when">
                When (optional, e.g. &quot;2 weeks ago&quot;)
              </label>
              <input id="when" name="when" maxLength={60} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="text">
              Review text
            </label>
            <textarea id="text" name="text" required rows={4} maxLength={1500} className={inputClass} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add review"}
            </button>
            {message && <span className="text-sm text-foreground/80">{message}</span>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Your added reviews ({manual.length})</h2>
        {manual.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            No reviews added yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {manual.map((review) => (
              <li key={review.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars />
                  <span className="font-semibold">{review.author_name}</span>
                  {review.when_text && <span className="text-xs text-muted">{review.when_text}</span>}
                  {!review.visible && (
                    <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">Hidden</span>
                  )}
                  <span className="ml-auto flex gap-3 text-sm">
                    <button type="button" onClick={() => toggleVisible(review)} className="font-medium text-primary hover:underline">
                      {review.visible ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => remove(review)} className="font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground/85">{review.review_text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {google.reviews.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold">Pulled from Google automatically</h2>
          <ul className="mt-3 space-y-3">
            {google.reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars />
                  <span className="font-semibold">{review.author}</span>
                  <span className="text-xs text-muted">{review.when}</span>
                </div>
                <p className="mt-2 text-sm text-foreground/85">{review.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

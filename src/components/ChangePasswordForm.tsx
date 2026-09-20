"use client";

import { useState, type FormEvent } from "react";

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:border-primary focus:outline-none";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok) {
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      setError(data.error ?? "Could not change the password.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground/80" htmlFor="current">
          Current password
        </label>
        <input id="current" type="password" required autoComplete="current-password" value={current}
          onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/80" htmlFor="next">
          New password (at least 12 characters)
        </label>
        <input id="next" type="password" required minLength={12} autoComplete="new-password" value={next}
          onChange={(e) => setNext(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/80" htmlFor="confirm">
          Repeat new password
        </label>
        <input id="confirm" type="password" required minLength={12} autoComplete="new-password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-green-700">Password changed. Use it the next time you log in.</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}

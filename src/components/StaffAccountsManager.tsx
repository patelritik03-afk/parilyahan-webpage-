"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AREAS, AREA_LABELS, type Area, type StaffRole } from "@/lib/adminAreas";

type Account = {
  username: string;
  displayName: string;
  areas: Area[];
  role: StaffRole;
  active: boolean;
};

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none";
const emptyForm = { username: "", displayName: "", areas: [] as Area[], role: "staff" as StaffRole };
const ROLE_LABEL: Record<StaffRole, string> = { staff: "Staff", head: "Head" };

function AreaPicker({ value, onChange }: { value: Area[]; onChange: (areas: Area[]) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {AREAS.map((area) => (
        <label key={area} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(area)}
            onChange={(e) => onChange(e.target.checked ? [...value, area] : value.filter((a) => a !== area))}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          {AREA_LABELS[area]}
        </label>
      ))}
    </div>
  );
}

export default function StaffAccountsManager() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Shown once after creating an account or resetting a password.
  const [newPassword, setNewPassword] = useState<{ username: string; password: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/staff");
    const data = await res.json().catch(() => ({}));
    setAccounts(data.accounts ?? []);
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setNewPassword(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setNewPassword({ username: form.username.trim().toLowerCase(), password: data.password });
      setForm(emptyForm);
      await load();
    } else {
      setMessage({ ok: false, text: data.error ?? "Could not create the account." });
    }
  }

  async function patch(username: string, body: Record<string, unknown>) {
    setMessage(null);
    const res = await fetch(`/api/admin/staff/${encodeURIComponent(username)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ ok: false, text: data.error ?? "Could not save." });
      return null;
    }
    return data;
  }

  async function handleReset(account: Account) {
    if (!confirm(`Make a new password for ${account.displayName}? The old one will stop working.`)) return;
    const data = await patch(account.username, { resetPassword: true });
    if (data?.password) setNewPassword({ username: account.username, password: data.password });
  }

  async function handleToggle(account: Account) {
    const verb = account.active ? "Switch off" : "Switch on";
    if (!confirm(`${verb} ${account.displayName}'s login?`)) return;
    if (await patch(account.username, { active: !account.active })) await load();
  }

  async function saveEdit(account: Account) {
    if (await patch(account.username, { displayName: account.displayName, areas: account.areas, role: account.role })) {
      setEditing(null);
      setMessage({ ok: true, text: "Saved." });
      await load();
    }
  }

  return (
    <div className="space-y-6">
      {newPassword && (
        <div className="rounded-2xl border border-green-600/40 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-semibold">Login details - copy them now, they are shown only once</p>
          <p className="mt-2">
            Username: <code className="font-mono">{newPassword.username}</code>
            <br />
            Password: <code className="select-all font-mono">{newPassword.password}</code>
          </p>
          <p className="mt-2 text-xs">They log in at /admin. Ask them to change the password under My Password.</p>
          <button type="button" onClick={() => setNewPassword(null)} className="mt-2 text-xs font-semibold underline">
            Done, hide it
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-semibold">Add a person</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-foreground/80">
            Name
            <input required value={form.displayName} placeholder="e.g. Maria"
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Username
            <input required value={form.username} placeholder="e.g. maria" autoCapitalize="none"
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Role
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))} className={inputClass}>
              <option value="staff">Staff - makes entries</option>
              <option value="head">Head - approves, sets par levels, sees costs</option>
            </select>
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/80">Can open</p>
          <div className="mt-2">
            <AreaPicker value={form.areas} onChange={(areas) => setForm((f) => ({ ...f, areas }))} />
          </div>
        </div>
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
        <button type="submit" disabled={busy || form.areas.length === 0}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? "Creating..." : "Create login"}
        </button>
      </form>

      {accounts === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted">No staff logins yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {accounts.map((account) =>
            editing === account.username ? (
              <EditRow key={account.username} account={account} onCancel={() => setEditing(null)} onSave={saveEdit} />
            ) : (
              <li key={account.username} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${account.active ? "" : "opacity-50"}`}>
                <div>
                  <p className="font-medium">
                    {account.displayName} <span className="text-sm text-muted">({account.username})</span>
                    {!account.active && <span className="ml-2 text-xs font-semibold text-red-600">switched off</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {ROLE_LABEL[account.role]} - {account.areas.map((a) => AREA_LABELS[a]).join(", ") || "no areas"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  <button type="button" onClick={() => setEditing(account.username)} className="text-primary hover:underline">Edit</button>
                  <button type="button" onClick={() => handleReset(account)} className="text-primary hover:underline">New password</button>
                  <button type="button" onClick={() => handleToggle(account)} className={account.active ? "text-red-600 hover:underline" : "text-green-700 hover:underline"}>
                    {account.active ? "Switch off" : "Switch on"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function EditRow({ account, onCancel, onSave }: { account: Account; onCancel: () => void; onSave: (a: Account) => void }) {
  const [draft, setDraft] = useState(account);
  return (
    <li className="space-y-3 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground/80">
          Name
          <input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-foreground/80">
          Role
          <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as StaffRole })} className={inputClass}>
            <option value="staff">Staff</option>
            <option value="head">Head</option>
          </select>
        </label>
      </div>
      <AreaPicker value={draft.areas} onChange={(areas) => setDraft({ ...draft, areas })} />
      <div className="flex gap-4 text-sm font-semibold">
        <button type="button" onClick={() => onSave(draft)} className="rounded-full bg-primary px-5 py-2 text-primary-foreground">Save</button>
        <button type="button" onClick={onCancel} className="text-muted hover:text-primary">Cancel</button>
      </div>
    </li>
  );
}

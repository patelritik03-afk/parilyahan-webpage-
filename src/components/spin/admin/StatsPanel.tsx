"use client";

import { useEffect, useState } from "react";

type Stats = {
  day: number;
  players: number;
  verified: number;
  spins: number;
  redeemed: number;
  prizes: {
    id: string;
    emoji: string;
    short_en: string;
    chance: number;
    limit_count: number | null;
    limit_period: string | null;
    won: number;
    drawn: number;
    share: number;
    today: number;
    thisWeek: number;
    redeemed: number;
  }[];
  sources: { source: string; players: number; verified: number }[];
};

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}

export default function StatsPanel({ campaignId }: { campaignId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/spin/stats?campaign=${campaignId}`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (r.ok) setStats(json);
        else setError(json.error ?? "Could not load.");
      })
      .catch(() => setError("Could not load."));
  }, [campaignId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-muted">Loading…</p>;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Started" value={stats.players} note="entered name + number" />
        <Tile label="Verified" value={stats.verified} note={`${pct(stats.verified, stats.players)} of started`} />
        <Tile label="Spins" value={stats.spins} />
        <Tile label="Coupons used" value={stats.redeemed} note={`${pct(stats.redeemed, stats.spins)} of spins`} />
      </div>
      <p className="text-sm text-muted">{stats.day >= 1 ? `Contest day ${stats.day}.` : `Starts in ${1 - stats.day} day(s).`}</p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Prize</th>
              <th className="px-3 py-2 text-right">Set chance</th>
              <th className="px-3 py-2 text-right">Won</th>
              <th className="px-3 py-2 text-right">Actual share</th>
              <th className="px-3 py-2 text-right">Today</th>
              <th className="px-3 py-2 text-right">This week</th>
              <th className="px-3 py-2">Limit</th>
              <th className="px-3 py-2 text-right">Used</th>
            </tr>
          </thead>
          <tbody>
            {stats.prizes.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">
                  {p.emoji} {p.short_en}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(p.chance)}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.won}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.share}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.today}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.thisWeek}</td>
                <td className="px-3 py-2 text-muted">{p.limit_count !== null ? `${p.limit_count} / ${p.limit_period === "campaign" ? "contest" : p.limit_period}` : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.redeemed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        &quot;Actual share&quot; is lower than the set chance when a limit was reached; those players got the &quot;instead&quot; prize.
      </p>

      <div>
        <h3 className="font-semibold">Where players came from</h3>
        {stats.sources.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No players yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {stats.sources.map((s) => (
              <li key={s.source} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 font-medium">{s.source}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-border/50">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.players / stats.sources[0].players) * 100}%` }} />
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums text-muted">
                  {s.players} · {s.verified} verified
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

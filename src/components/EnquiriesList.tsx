"use client";

import { useEffect, useState } from "react";
import type { Enquiry } from "@/lib/types";

const TYPES = ["All", "Event", "Marketing collab", "Partnership", "Other"];

function formatSubmitted(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EnquiriesList() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("All");

  useEffect(() => {
    Promise.resolve()
      .then(() => fetch("/api/admin/enquiries"))
      .then((res) => res.json())
      .then((data) => setEnquiries(data.enquiries ?? []))
      .finally(() => setLoading(false));
  }, []);

  const shown = type === "All" ? enquiries : enquiries.filter((e) => e.type === type);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              type === t ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/80 hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-sm text-muted">
            {shown.length} enquir{shown.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : shown.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            No enquiries yet.
          </p>
        ) : (
          shown.map((e) => (
            <article key={e.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  {e.type}
                </span>
                <span className="font-semibold">{e.name}</span>
                <span className="ml-auto text-xs text-muted">{formatSubmitted(e.created_at)}</span>
              </div>

              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                  {e.phone}
                </a>
                <a href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  WhatsApp
                </a>
                <a href={`mailto:${e.email}`} className="text-primary hover:underline">
                  {e.email}
                </a>
              </p>

              {e.type === "Event" && (
                <p className="mt-2 text-sm text-foreground/85">
                  <strong>{e.event_type}</strong> · {e.pax} guests · {e.event_date}
                </p>
              )}
              {e.specify && <p className="mt-2 text-sm text-foreground/85">About: {e.specify}</p>}
              {e.message && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{e.message}</p>}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import MenuEditor from "./MenuEditor";
import MenuUploader from "./MenuUploader";

const tabs = [
  { id: "manual", label: "Manual entry" },
  { id: "upload", label: "Upload file" },
] as const;

export default function MenuManager() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("manual");

  return (
    <div>
      <div className="flex gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/80 hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "manual" ? <MenuEditor /> : <MenuUploader />}</div>
    </div>
  );
}

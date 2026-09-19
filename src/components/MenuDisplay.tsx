"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MenuItem } from "@/lib/types";

export default function MenuDisplay({ items }: { items: MenuItem[] }) {
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
        {t("menu.notDecided")}
      </p>
    );
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <div key={category}>
          <h2 className="font-display text-xl font-semibold text-primary">{category}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {items
              .filter((i) => i.category === category)
              .map((item, idx) => (
                <li key={`${item.name}-${idx}`} className="rounded-lg border border-border bg-surface p-4">
                  <p className="font-semibold">{item.name}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted">{item.description}</p>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

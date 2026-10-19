import Link from "next/link";
import { getAdminSession, isStockManager } from "@/lib/auth";

type Tile = { href?: string; title: string; text: string; managerOnly?: boolean };

const TILES: Tile[] = [
  { href: "/stock/items", title: "Items", text: "Every stock item with its current quantity. Search by any name." },
  { href: "/stock/suppliers", title: "Suppliers", text: "Who you buy from, with contact details." },
  { href: "/stock/import", title: "Import / Export", text: "Load items from Excel, or download them to fill in units, par levels and costs.", managerOnly: true },
  { title: "Bills (intake)", text: "Enter supplier bills to add stock. Coming next." },
  { title: "Daily consumption", text: "What the kitchen used today, plus wastage. Coming next." },
  { title: "Stock check", text: "Count the store and correct the numbers. Coming soon." },
  { title: "Orders", text: "Make an order, send it for approval, download the PDF. Coming soon." },
  { title: "Dashboard", text: "Food cost, top items, slow movers, price alerts. Coming soon.", managerOnly: true },
];

export default async function StockHome() {
  const session = await getAdminSession();
  const manager = session ? isStockManager(session) : false;
  const tiles = TILES.filter((t) => manager || !t.managerOnly);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Stock register</h1>
      <p className="mt-1 text-sm text-muted">Hello {session?.name}. Choose what you want to do.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) =>
          tile.href ? (
            <Link
              key={tile.title}
              href={tile.href}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary"
            >
              <p className="font-display text-lg font-semibold text-primary">{tile.title}</p>
              <p className="mt-1 text-sm text-foreground/80">{tile.text}</p>
            </Link>
          ) : (
            <div key={tile.title} className="rounded-2xl border border-dashed border-border p-5 opacity-60">
              <p className="font-display text-lg font-semibold">{tile.title}</p>
              <p className="mt-1 text-sm text-foreground/80">{tile.text}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

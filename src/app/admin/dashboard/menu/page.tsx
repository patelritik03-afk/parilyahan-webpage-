import MenuManager from "@/components/MenuManager";

export default function AdminMenuPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Menu</h1>
      <p className="mt-1 text-sm text-muted">
        Type a day&apos;s menu by section, or upload a spreadsheet to add many days at once. Customers see changes the
        moment you save.
      </p>
      <div className="mt-6">
        <MenuManager />
      </div>
    </div>
  );
}

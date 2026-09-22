import OffersManager from "@/components/OffersManager";

export default function AdminOffersPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Offers &amp; Pricing</h1>
      <p className="mt-1 text-sm text-muted">
        Shown on the home page. Hide an offer instead of removing it if you want to bring it back later.
      </p>
      <div className="mt-6">
        <OffersManager />
      </div>
    </div>
  );
}

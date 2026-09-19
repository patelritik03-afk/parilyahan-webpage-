import ReviewsManager from "@/components/ReviewsManager";

export default function AdminReviewsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Reviews</h1>
      <p className="mt-1 text-sm text-muted">
        Only 5-star reviews are shown on the home page, one by one. Manage them here.
      </p>
      <div className="mt-6">
        <ReviewsManager />
      </div>
    </div>
  );
}

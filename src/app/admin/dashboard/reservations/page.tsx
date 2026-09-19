import ReservationsList from "@/components/ReservationsList";

export default function AdminReservationsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Reservations</h1>
      <p className="mt-1 text-sm text-muted">
        All reservations are auto-confirmed for now. Reach out directly if you need to adjust one.
      </p>
      <div className="mt-6">
        <ReservationsList />
      </div>
    </div>
  );
}

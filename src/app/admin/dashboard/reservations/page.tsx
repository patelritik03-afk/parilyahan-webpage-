import ReservationsList from "@/components/ReservationsList";

export default function AdminReservationsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Reservations</h1>
      <p className="mt-1 text-sm text-muted">
        New bookings are confirmed automatically. Filter, edit or delete them here, and download a report as Excel or PDF, or print it.
      </p>
      <div className="mt-6">
        <ReservationsList />
      </div>
    </div>
  );
}

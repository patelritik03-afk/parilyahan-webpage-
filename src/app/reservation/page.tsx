import ReservationForm from "@/components/ReservationForm";
import ReservationHeader from "@/components/ReservationHeader";

export const metadata = {
  title: "Reserve a Table | Parilyahan Sa Kalye",
};

export default function ReservationPage() {
  return (
    <>
      <ReservationHeader />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <ReservationForm />
      </div>
    </>
  );
}

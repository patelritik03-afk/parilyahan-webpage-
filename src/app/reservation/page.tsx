import ReservationForm from "@/components/ReservationForm";
import ReservationHeader from "@/components/ReservationHeader";

export const metadata = {
  title: "Reserve a Table",
  description:
    "Book your table at Parilyahan Sa Kalye, the unlimited Filipino buffet in Jumeirah 1, Dubai. Open daily 1 PM to 10 PM.",
  alternates: { canonical: "/reservation" },
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

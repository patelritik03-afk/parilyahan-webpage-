import ReservationForm from "@/components/ReservationForm";
import ReservationHeader from "@/components/ReservationHeader";
import ReservationInfo from "@/components/ReservationInfo";

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
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <ReservationInfo />
        <ReservationForm />
      </div>
    </>
  );
}

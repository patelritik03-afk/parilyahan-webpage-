import EnquiryForm from "@/components/EnquiryForm";
import EnquiryHeader from "@/components/EnquiryHeader";

export const metadata = {
  title: "Enquiries",
  description:
    "Plan an event, collaboration or partnership with Parilyahan Sa Kalye, the Filipino buffet restaurant in Dubai.",
  alternates: { canonical: "/enquiries" },
};

export default function EnquiriesPage() {
  return (
    <>
      <EnquiryHeader />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <EnquiryForm />
      </div>
    </>
  );
}

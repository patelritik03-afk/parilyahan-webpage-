import EnquiriesList from "@/components/EnquiriesList";

export default function AdminEnquiriesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Enquiries</h1>
      <p className="mt-1 text-sm text-muted">
        Everything sent through the website&apos;s Enquiries page, newest first. Tap a number or email to reply.
      </p>
      <div className="mt-6">
        <EnquiriesList />
      </div>
    </div>
  );
}

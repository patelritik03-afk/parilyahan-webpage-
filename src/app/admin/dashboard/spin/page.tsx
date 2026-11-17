import SpinAdmin from "@/components/spin/admin/SpinAdmin";

export default function AdminSpinPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Spin &amp; Win</h1>
      <p className="mt-1 text-sm text-muted">
        Every win shows up here with the guest&apos;s name. Search the code the guest shows you and press &quot;Mark used&quot;.
      </p>
      <div className="mt-6">
        <SpinAdmin />
      </div>
    </div>
  );
}

import ChangePasswordForm from "@/components/ChangePasswordForm";
import StaffAccountsManager from "@/components/StaffAccountsManager";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Change the admin password. Use a long one and keep it in a password manager.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Staff accounts</h2>
        <p className="mt-1 text-sm text-muted">
          Give each person their own login, so every entry shows who made it. Staff make entries; heads also approve
          orders and stock checks, set par levels and see costs.
        </p>
        <div className="mt-6">
          <StaffAccountsManager />
        </div>
      </section>
    </div>
  );
}

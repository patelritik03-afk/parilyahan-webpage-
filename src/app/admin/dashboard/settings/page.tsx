import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Change the admin password. Use a long one and keep it in a password manager.
      </p>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}

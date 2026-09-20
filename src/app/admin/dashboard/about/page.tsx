import AboutManager from "@/components/AboutManager";

export default function AdminAboutPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">About Us</h1>
      <p className="mt-1 text-sm text-muted">
        Edit the text on the About Us page, in English and Tagalog. Changes show on the website after you save.
      </p>
      <div className="mt-6">
        <AboutManager />
      </div>
    </div>
  );
}

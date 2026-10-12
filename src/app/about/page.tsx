import AboutContent from "@/components/AboutContent";
import { getAboutOverride } from "@/lib/aboutStore";

export const metadata = {
  title: "About Us",
  description:
    "The story of Parilyahan Sa Kalye: home-cooked Filipino street food as an unlimited buffet at Ibis Styles Hotel, Jumeirah 1, Dubai.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

export default async function AboutPage() {
  return <AboutContent override={await getAboutOverride()} />;
}

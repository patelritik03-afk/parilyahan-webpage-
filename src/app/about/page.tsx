import AboutContent from "@/components/AboutContent";
import { getAboutOverride } from "@/lib/aboutStore";

export const metadata = {
  title: "About Us | Parilyahan Sa Kalye",
};

export const revalidate = 300;

export default async function AboutPage() {
  return <AboutContent override={await getAboutOverride()} />;
}

import SeoLanding from "@/components/SeoLanding";
import { FAQ_PAGE } from "@/lib/seoPages";

export const metadata = {
  title: FAQ_PAGE.metaTitle,
  description: FAQ_PAGE.description,
  alternates: { canonical: `/${FAQ_PAGE.slug}` },
};

export default function FaqPage() {
  return <SeoLanding page={FAQ_PAGE} />;
}

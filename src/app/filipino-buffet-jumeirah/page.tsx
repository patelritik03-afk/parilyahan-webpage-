import SeoLanding from "@/components/SeoLanding";
import { JUMEIRAH_PAGE } from "@/lib/seoPages";

export const metadata = {
  title: JUMEIRAH_PAGE.metaTitle,
  description: JUMEIRAH_PAGE.description,
  alternates: { canonical: `/${JUMEIRAH_PAGE.slug}` },
};

export default function FilipinoBuffetJumeirahPage() {
  return <SeoLanding page={JUMEIRAH_PAGE} />;
}

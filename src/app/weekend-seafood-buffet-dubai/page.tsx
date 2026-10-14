import SeoLanding from "@/components/SeoLanding";
import { WEEKEND_PAGE } from "@/lib/seoPages";

export const metadata = {
  title: WEEKEND_PAGE.metaTitle,
  description: WEEKEND_PAGE.description,
  alternates: { canonical: `/${WEEKEND_PAGE.slug}` },
};

export default function WeekendSeafoodBuffetPage() {
  return <SeoLanding page={WEEKEND_PAGE} />;
}

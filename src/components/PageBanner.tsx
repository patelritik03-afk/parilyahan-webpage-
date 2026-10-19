import Image from "next/image";
import type { ReactNode } from "react";

export default function PageBanner({
  image = "/images/hero-buffet.webp",
  compact = false,
  children,
}: {
  image?: string;
  // Shorter on phones, so a form below it starts higher up the screen.
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-header text-header-foreground">
      <Image src={image} alt="" fill loading="eager" fetchPriority="high" quality={50} sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${compact ? "py-8 sm:py-20" : "py-14 sm:py-20"}`}>{children}</div>
    </section>
  );
}

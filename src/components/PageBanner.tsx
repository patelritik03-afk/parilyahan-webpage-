import Image from "next/image";
import type { ReactNode } from "react";

export default function PageBanner({
  image = "/images/hero-buffet.webp",
  children,
}: {
  image?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-header text-header-foreground">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">{children}</div>
    </section>
  );
}

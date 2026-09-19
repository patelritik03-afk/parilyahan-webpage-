"use client";

import Link from "next/link";
import Image from "next/image";
import SocialLinks from "./SocialLinks";
import { ADDRESS_LINES, CONTACT_EMAIL, MAPS_URL, PHONE_DISPLAY, PHONE_TEL, WHATSAPP_NUMBER } from "@/lib/site";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

const links: { href: string; key: TranslationKey }[] = [
  { href: "/menu", key: "nav.menu" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/about", key: "nav.about" },
  { href: "/enquiries", key: "nav.enquiries" },
  { href: "/reservation", key: "nav.reserve" },
];

export default function Footer() {
  const { t } = useLanguage();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Parilyahan Sa Kalye";
  const year = new Date().getFullYear();

  return (
    <footer className="bg-header text-header-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image
            src="/brand/logo.png"
            alt="Parilyahan sa Kalye"
            width={900}
            height={377}
            className="h-20 w-auto"
          />
          <p className="mt-3 text-sm text-header-foreground/70">{t("footer.tagline")}</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-header-foreground/80 hover:text-accent">
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div>
          <p className="text-sm font-semibold text-accent">{t("footer.hours")}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-header-foreground/60">
            {t("footer.findUs")}
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm leading-relaxed text-header-foreground/85 hover:text-accent"
          >
            {ADDRESS_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="mt-1 inline-block text-accent underline">{t("footer.directions")}</span>
          </a>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-header-foreground/60">
            {t("footer.contact")}
          </p>
          <div className="mt-2 flex flex-col gap-1 text-sm text-header-foreground/85">
            <a href={`tel:${PHONE_TEL}`} className="hover:text-accent">
              {PHONE_DISPLAY}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="break-all hover:text-accent">
              {CONTACT_EMAIL}
            </a>
          </div>
          <SocialLinks className="mt-5" />
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-header-foreground/60 sm:px-6">
        © {year} {siteName}. {t("footer.rights")}
      </div>
    </footer>
  );
}

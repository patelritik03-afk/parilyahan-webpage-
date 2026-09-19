import { FACEBOOK_URL, INSTAGRAM_URL, MAPS_URL, TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/site";

const iconClass = "h-5 w-5";

function InstagramIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v7h3v-7h2.2l.8-3H14v-1.5c0-.6.4-1 1-1h1.5V8Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 18l-1.2 3.6L8.5 20.4A8.5 8.5 0 1 0 4 13" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4.9-1l-.3-1.2a.9.9 0 0 0-.9-.7l-1.2.2a4.5 4.5 0 0 1-2.5-2.5l.2-1.2a.9.9 0 0 0-.7-.9L9 7.6c-.6-.1-1 .3-1 .9v1Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function SocialLinks({ className = "" }: { className?: string }) {
  const whatsapp = WHATSAPP_NUMBER;
  const maps = MAPS_URL;

  const items = [
    { href: INSTAGRAM_URL, label: "Instagram", icon: <InstagramIcon /> },
    { href: FACEBOOK_URL, label: "Facebook", icon: <FacebookIcon /> },
    { href: TIKTOK_URL, label: "TikTok", icon: <TikTokIcon /> },
    whatsapp && {
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
    },
    maps && { href: maps, label: "Directions", icon: <MapPinIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className="text-header-foreground/75 transition-colors hover:text-accent"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

import type { SVGProps } from "react";

// Simple line icons for the stock app (24x24, drawn with the current text colour).
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export type IconName =
  | "dashboard"
  | "items"
  | "suppliers"
  | "import"
  | "bills"
  | "usage"
  | "count"
  | "orders"
  | "reports"
  | "alert"
  | "check";

export function StockIcon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  switch (name) {
    case "dashboard":
      return (
        <Icon {...props}>
          <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
          <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
          <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
          <rect x="3" y="15" width="7.5" height="6" rx="1.5" />
        </Icon>
      );
    case "items":
      return (
        <Icon {...props}>
          <path d="M21 8 12 3 3 8l9 5 9-5Z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </Icon>
      );
    case "suppliers":
      return (
        <Icon {...props}>
          <path d="M2 6h11v10H2z" />
          <path d="M13 9h4.5L21 12.5V16h-8" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </Icon>
      );
    case "import":
      return (
        <Icon {...props}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5" />
          <path d="M9 13l3 3 3-3" />
          <path d="M12 9.5V16" />
        </Icon>
      );
    case "bills":
      return (
        <Icon {...props}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </Icon>
      );
    case "usage":
      return (
        <Icon {...props}>
          <path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-2Z" />
          <path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" />
        </Icon>
      );
    case "count":
      return (
        <Icon {...props}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V3h6v1" />
          <path d="m8.5 12 2 2 4-4" />
          <path d="M9 17h6" />
        </Icon>
      );
    case "orders":
      return (
        <Icon {...props}>
          <path d="M3 4h2.5l2.2 11h10.6L21 7H7" />
          <circle cx="9.5" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </Icon>
      );
    case "reports":
      return (
        <Icon {...props}>
          <path d="M4 20V4" />
          <path d="M4 20h16" />
          <path d="M8 16v-4M12 16V8M16 16v-6" />
        </Icon>
      );
    case "alert":
      return (
        <Icon {...props}>
          <path d="M12 3 2 20h20L12 3Z" />
          <path d="M12 10v4M12 17h.01" />
        </Icon>
      );
    case "check":
      return (
        <Icon {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </Icon>
      );
  }
}

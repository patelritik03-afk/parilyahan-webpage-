import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Parilyahan Sa Kalye";

// The title starts with what people search for ("Filipino buffet Dubai"); other pages add " | name" after theirs.
const title = `Filipino Buffet in Dubai from AED 39 | ${siteName}`;
const description =
  "Halal certified unlimited Filipino buffet in Dubai from AED 39 + taxes. Fresh daily menu at Ibis Styles Hotel, Jumeirah 1. Reserve online.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: `%s | ${siteName}` },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName,
    title,
    description,
    images: [{ url: "/images/hero-buffet.webp", width: 2000, height: 1333, alt: siteName }],
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}

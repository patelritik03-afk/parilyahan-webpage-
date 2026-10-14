import Link from "next/link";
import PageBanner from "./PageBanner";
import { ADDRESS_LINES, MAPS_URL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";
import { OPEN_HOURS, SEO_PAGES, WEEKDAY_PRICE, WEEKEND_PRICE, type SeoPage } from "@/lib/seoPages";

const buttonPrimary =
  "rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90";
const buttonOutline =
  "rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold hover:border-primary hover:text-primary";

// Server-rendered (no client JS) so Google reads all the text straight away.
export default function SeoLanding({ page }: { page: SeoPage }) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  const others = SEO_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <>
      <PageBanner>
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">{page.eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">{page.h1}</h1>
      </PageBanner>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-lg leading-relaxed text-foreground/90">{page.intro}</p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Buffet price</p>
            <p className="mt-1 text-sm leading-relaxed">
              Mon - Thu: <strong>AED {WEEKDAY_PRICE}</strong> + taxes
              <br />
              Fri - Sun: <strong>AED {WEEKEND_PRICE}</strong> + taxes
              <br />
              <span className="text-muted">Halal certified</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Open daily</p>
            <p className="mt-1 text-sm leading-relaxed">{OPEN_HOURS}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Find us</p>
            <p className="mt-1 text-sm leading-relaxed">
              {ADDRESS_LINES.slice(1).join(", ")}
              <br />
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Get directions
              </a>
            </p>
          </div>
        </div>

        {page.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-display text-2xl font-bold">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-foreground/90">
              {section.paragraphs.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Common questions</h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {page.faqs.map((faq) => (
              <details key={faq.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {faq.q}
                    <span aria-hidden className="text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-2 leading-relaxed text-foreground/85">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/reservation" className={buttonPrimary}>
            Reserve a table
          </Link>
          <Link href="/menu" className={buttonOutline}>
            See today&apos;s menu
          </Link>
          <a href={`tel:${PHONE_TEL}`} className={buttonOutline}>
            Call {PHONE_DISPLAY}
          </a>
        </div>

        <nav aria-label="More about us" className="mt-10 border-t border-border pt-6 text-sm">
          <p className="font-semibold text-muted">More about Parilyahan Sa Kalye</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`} className="text-primary underline">
                  {p.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/gallery" className="text-primary underline">
                Photo gallery
              </Link>
            </li>
            <li>
              <Link href="/enquiries" className="text-primary underline">
                Groups and events
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <script
        type="application/ld+json"
        // "<" is escaped so the data can never close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}

/* eslint-disable @next/next/no-img-element -- ImageResponse renders plain <img>; next/image does not apply here */
import type { CSSProperties } from "react";
import {
  BADGE,
  BUCKET_H,
  CONTENT_TOP,
  CREAM,
  DARK,
  FOOTER_H,
  HERO_H,
  HERO_IMG_H,
  INK,
  INNER_W,
  LINE,
  LOGO_H,
  LOGO_W,
  MARGIN,
  MENU_BORDER,
  MENU_BOTTOM,
  MENU_HEADING_H,
  MENU_PAD_X,
  MENU_PAD_Y,
  MUTED,
  POSTER_H,
  POSTER_TEXT as TEXT,
  POSTER_W,
  PRICE_GAP,
  PRICE_H,
  PRICE_TOP,
  PRICE_W,
  RED,
  VAT_H,
  VAT_TOP,
  YELLOW,
  menuTop,
} from "./constants";
import {
  COLUMN_GAP,
  DISH_LINE,
  HEAD_BAR_H,
  HEAD_BAR_W,
  HEAD_LINE,
  dishGap,
  groupGap,
  headBarGap,
  headMarginBottom,
  headSize,
  type MenuLayout,
} from "./layout";

type FontKey = "medium" | "semibold" | "extrabold" | "extrabolditalic";
export type Fit = (text: string, maxWidth: number, maxSize: number, font: FontKey) => number;

export type PosterProps = {
  date: { short: string; weekday: string; weekend: boolean };
  layout: MenuLayout;
  logo: string;
  hero: string;
  bucketBadge: string;
  fit: Fit;
};

const abs = (left: number, top: number, width: number, height: number): CSSProperties => ({
  position: "absolute",
  left,
  top,
  width,
  height,
  display: "flex",
});

function Star({ size = 16, color = RED }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <polygon points="12,1.5 15,9 23,9.3 16.8,14.4 19,22.3 12,17.8 5,22.3 7.2,14.4 1,9.3 9,9" fill={color} />
    </svg>
  );
}

function Hero({ hero, logo, date, fit }: { hero: string; logo: string; date: PosterProps["date"]; fit: Fit }) {
  const badgeW = 280;
  const weekday = date.weekday.toUpperCase();
  const headline = "UNLI BUFFET";
  return (
    <div style={{ ...abs(0, 0, POSTER_W, HERO_H), overflow: "hidden" }}>
      <img src={hero} alt="" width={POSTER_W} height={HERO_IMG_H} style={{ position: "absolute", left: 0, top: 0 }} />
      {/* Darkens the top for the logo and the bottom for the headline, keeps the food bright in the middle. */}
      <div
        style={{
          ...abs(0, 0, POSTER_W, HERO_H),
          backgroundImage:
            "linear-gradient(180deg, rgba(14,9,6,0.72) 0%, rgba(14,9,6,0.18) 30%, rgba(14,9,6,0.30) 52%, rgba(14,9,6,0.92) 100%)",
        }}
      />

      <img src={logo} alt="" width={LOGO_W} height={LOGO_H} style={{ position: "absolute", left: MARGIN - 6, top: 28 }} />

      <div
        style={{
          ...abs(POSTER_W - MARGIN - badgeW, 34, badgeW, 112),
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: YELLOW,
          borderRadius: 22,
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontSize: fit(weekday, badgeW - 36, 40, "extrabolditalic"),
            fontWeight: 800,
            fontStyle: "italic",
            color: DARK,
            lineHeight: 1.05,
          }}
        >
          {weekday}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: DARK, lineHeight: 1.25, letterSpacing: 1 }}>
          {date.short.toUpperCase()}
        </div>
      </div>

      <div style={{ ...abs(MARGIN, 270, INNER_W, 216), flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: YELLOW, letterSpacing: 8, lineHeight: 1.15 }}>ALL-WEEK</div>
        <div
          style={{
            fontSize: fit(headline, INNER_W, 118, "extrabolditalic"),
            fontWeight: 800,
            fontStyle: "italic",
            color: "#ffffff",
            lineHeight: 0.98,
            letterSpacing: -2,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: fit(TEXT.tagline, INNER_W, 30, "semibold"),
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.3,
            marginTop: 6,
          }}
        >
          {TEXT.tagline}
        </div>
      </div>
    </div>
  );
}

function PriceCard({
  data,
  left,
  background,
  today,
  fit,
}: {
  data: typeof TEXT.weekday;
  left: number;
  background: string;
  today: boolean;
  fit: Fit;
}) {
  const priceW = 172;
  const textW = PRICE_W - 2 * 24 - priceW - 12;
  return (
    <div
      style={{
        ...abs(left, PRICE_TOP, PRICE_W, PRICE_H),
        alignItems: "center",
        padding: "0 24px",
        background,
        borderRadius: 26,
        border: today ? `4px solid ${YELLOW}` : "4px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 34px rgba(0,0,0,0.30)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: priceW }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: YELLOW, lineHeight: 1, letterSpacing: 2 }}>AED</div>
        <div style={{ fontSize: 104, fontWeight: 800, fontStyle: "italic", color: YELLOW, lineHeight: 0.92 }}>
          {data.price}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: textW, marginLeft: 12 }}>
        <div style={{ fontSize: fit(data.label, textW, 32, "extrabolditalic"), fontWeight: 800, fontStyle: "italic", color: YELLOW, lineHeight: 1.15 }}>
          {data.label}
        </div>
        <div style={{ fontSize: fit(data.days, textW, 21, "extrabold"), fontWeight: 800, color: "#ffffff", lineHeight: 1.35 }}>
          {data.days}
        </div>
        <div style={{ fontSize: fit(data.hours, textW, 21, "semibold"), fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.35 }}>
          {data.hours}
        </div>
      </div>
      {today && (
        <div
          style={{
            position: "absolute",
            right: 20,
            top: -17,
            display: "flex",
            padding: "4px 16px",
            background: YELLOW,
            color: DARK,
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          TODAY
        </div>
      )}
    </div>
  );
}

function BucketBanner({ badge, fit }: { badge: string; fit: Fit }) {
  const textLeft = BADGE + 44;
  const textW = INNER_W - textLeft - 24;
  return (
    <div
      style={{
        ...abs(MARGIN, CONTENT_TOP, INNER_W, BUCKET_H),
        alignItems: "center",
        background: RED,
        borderRadius: 24,
        border: `3px solid ${YELLOW}`,
        boxSizing: "border-box",
      }}
    >
      <img
        src={badge}
        alt=""
        width={BADGE}
        height={BADGE}
        style={{
          position: "absolute",
          left: 18,
          top: (BUCKET_H - BADGE) / 2 - 3,
          borderRadius: BADGE / 2,
          border: `5px solid ${YELLOW}`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: textLeft, width: textW }}>
        <Star size={26} color={YELLOW} />
        <div
          style={{
            fontSize: fit(TEXT.freeBucket, textW - 90, 46, "extrabolditalic"),
            fontWeight: 800,
            fontStyle: "italic",
            color: YELLOW,
            margin: "0 16px",
          }}
        >
          {TEXT.freeBucket}
        </div>
        <Star size={26} color={YELLOW} />
      </div>
    </div>
  );
}

function MenuCard({ layout, top }: { layout: MenuLayout; top: number }) {
  const f = layout.fontSize;
  const hs = headSize(f);
  return (
    <div
      style={{
        ...abs(MARGIN, top, INNER_W, MENU_BOTTOM - top),
        flexDirection: "column",
        padding: `${MENU_PAD_Y}px ${MENU_PAD_X}px`,
        background: "#ffffff",
        borderRadius: 28,
        border: `${MENU_BORDER}px solid ${LINE}`,
        boxShadow: "0 10px 30px rgba(120,70,20,0.10)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: MENU_HEADING_H, paddingBottom: 14 }}>
        <div style={{ width: 10, height: 34, background: YELLOW, borderRadius: 4, marginRight: 14 }} />
        <div style={{ fontSize: 32, fontWeight: 800, color: RED, letterSpacing: 3 }}>TODAY&apos;S MENU</div>
        <div style={{ flexGrow: 1, height: 2, background: LINE, marginLeft: 20 }} />
      </div>
      {/* Centred in the card, so a short menu sits in the middle instead of leaving the bottom empty. */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {layout.columns.map((column, ci) => (
          <div
            key={ci}
            style={{
              display: "flex",
              flexDirection: "column",
              width: layout.columnWidth,
              marginLeft: ci === 0 ? 0 : COLUMN_GAP,
            }}
          >
            {column.map((group, gi) => (
              <div
                key={`${group.category}-${gi}`}
                style={{ display: "flex", flexDirection: "column", marginTop: gi === 0 ? 0 : groupGap(f) }}
              >
                <div style={{ fontSize: hs, fontWeight: 800, color: RED, lineHeight: HEAD_LINE }}>{group.category}</div>
                <div
                  style={{
                    width: HEAD_BAR_W,
                    height: HEAD_BAR_H,
                    borderRadius: 2,
                    background: YELLOW,
                    marginTop: headBarGap(f),
                    marginBottom: headMarginBottom(f),
                  }}
                />
                {group.dishes.map((dish, di) => (
                  <div
                    key={`${dish}-${di}`}
                    style={{ fontSize: f, fontWeight: 500, color: INK, lineHeight: DISH_LINE, marginBottom: dishGap(f) }}
                  >
                    {dish}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function Phone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
      <path
        fill={DARK}
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      />
    </svg>
  );
}

function Pin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24">
      <path
        fill={YELLOW}
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      />
    </svg>
  );
}

function Footer({ fit }: { fit: Fit }) {
  const callW = 404;
  const addrW = 300;
  const divider: CSSProperties = { width: 2, height: 76, background: "rgba(255,255,255,0.18)" };
  return (
    <div
      style={{
        ...abs(0, POSTER_H - FOOTER_H, POSTER_W, FOOTER_H),
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${MARGIN}px`,
        background: DARK,
        borderTop: `6px solid ${RED}`,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: callW }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            borderRadius: 30,
            background: YELLOW,
            marginRight: 14,
          }}
        >
          <Phone />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: callW - 74 }}>
          <div style={{ fontSize: fit(TEXT.callLabel, callW - 74, 17, "extrabold"), fontWeight: 800, color: "#ffffff", lineHeight: 1.25, letterSpacing: 1 }}>
            {TEXT.callLabel}
          </div>
          <div style={{ fontSize: fit(TEXT.phones, callW - 74, 29, "extrabold"), fontWeight: 800, color: YELLOW, lineHeight: 1.25 }}>
            {TEXT.phones}
          </div>
        </div>
      </div>
      <div style={divider} />
      <div style={{ display: "flex", alignItems: "center", width: addrW + 52 }}>
        <Pin />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 6, width: addrW }}>
          <div style={{ fontSize: fit(TEXT.addressLine1, addrW, 20, "semibold"), fontWeight: 600, color: "#ffffff", lineHeight: 1.35 }}>
            {TEXT.addressLine1}
          </div>
          <div style={{ fontSize: fit(TEXT.addressLine2, addrW, 20, "semibold"), fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.35 }}>
            {TEXT.addressLine2}
          </div>
        </div>
      </div>
      <div style={divider} />
      <div style={{ display: "flex", alignItems: "center", width: 172 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            borderRadius: 14,
            background: YELLOW,
            color: DARK,
            fontSize: 44,
            fontWeight: 800,
            marginRight: 12,
          }}
        >
          P
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: YELLOW, fontWeight: 800, fontStyle: "italic" }}>
          <div style={{ fontSize: 26, lineHeight: 1.05 }}>{TEXT.parkingTop}</div>
          <div style={{ fontSize: 26, lineHeight: 1.05 }}>{TEXT.parkingBottom}</div>
        </div>
      </div>
    </div>
  );
}

export default function PosterTemplate({ date, layout, logo, hero, bucketBadge, fit }: PosterProps) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: POSTER_W,
        height: POSTER_H,
        background: CREAM,
        fontFamily: "Poppins",
      }}
    >
      <Hero hero={hero} logo={logo} date={date} fit={fit} />

      <PriceCard data={TEXT.weekday} left={MARGIN} background={DARK} today={!date.weekend} fit={fit} />
      <PriceCard data={TEXT.weekend} left={MARGIN + PRICE_W + PRICE_GAP} background={RED} today={date.weekend} fit={fit} />

      <div style={{ ...abs(0, VAT_TOP, POSTER_W, VAT_H), alignItems: "center", justifyContent: "center" }}>
        <Star />
        <div style={{ fontSize: 19, fontWeight: 600, color: MUTED, margin: "0 12px" }}>{TEXT.vat}</div>
        <Star />
      </div>

      {date.weekend && <BucketBanner badge={bucketBadge} fit={fit} />}

      <MenuCard layout={layout} top={menuTop(date.weekend)} />

      <Footer fit={fit} />
    </div>
  );
}

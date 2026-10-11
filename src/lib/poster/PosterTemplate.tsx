/* eslint-disable @next/next/no-img-element -- ImageResponse renders plain <img>; next/image does not apply here */
import type { CSSProperties, ReactNode } from "react";
import {
  CARD_BORDER,
  CARD_H,
  CARD_INNER_H,
  CARD_PAD,
  COLLAGE_H,
  COLLAGE_W,
  COLUMN_GAP,
  COLUMN_W,
  CONTENT_H,
  DARK,
  DATE_H,
  FOOTER_H,
  INK,
  LEFT_W,
  LOGO_H,
  LOGO_W,
  PAD,
  POSTER_H,
  POSTER_TEXT as TEXT,
  POSTER_W,
  RED,
  RIGHT_W,
  COL_GAP,
  BODY_BOTTOM_GAP,
  YELLOW,
} from "./constants";
import {
  DISH_LINE,
  HEAD_LINE,
  HEAD_RULE,
  dishGap,
  groupGap,
  headMarginBottom,
  headPadBottom,
  headSize,
  type MenuLayout,
} from "./layout";

type FontKey = "medium" | "semibold" | "extrabold" | "extrabolditalic";
export type Fit = (text: string, maxWidth: number, maxSize: number, font: FontKey) => number;

export type PosterProps = {
  date: { short: string; weekday: string };
  layout: MenuLayout;
  logo: string;
  collage: string;
  fit: Fit;
};

const PRICE_H = 140;

function Slant({ width, height, color, skew = 18 }: { width: number; height: number; color: string; skew?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <polygon points={`${skew},0 ${width},0 ${width - skew},${height} 0,${height}`} fill={color} />
    </svg>
  );
}

function Star({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12,1.5 15,9 23,9.3 16.8,14.4 19,22.3 12,17.8 5,22.3 7.2,14.4 1,9.3 9,9"
        fill={YELLOW}
      />
    </svg>
  );
}

function PriceBanner({
  data,
  color,
  fit,
}: {
  data: typeof TEXT.weekday;
  color: string;
  fit: Fit;
}) {
  const textW = LEFT_W - 190;
  return (
    <div style={{ display: "flex", position: "relative", width: LEFT_W, height: PRICE_H }}>
      <Slant width={LEFT_W} height={PRICE_H} color={color} />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 0,
          width: 150,
          height: PRICE_H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800, color: YELLOW, lineHeight: 1 }}>AED</div>
        <div style={{ fontSize: 96, fontWeight: 800, fontStyle: "italic", color: YELLOW, lineHeight: 0.92 }}>
          {data.price}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 182,
          top: 0,
          width: textW,
          height: PRICE_H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: fit(data.days, textW, 24, "extrabold"), fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
          {data.days}
        </div>
        <div style={{ fontSize: fit(data.hours, textW, 24, "extrabold"), fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
          {data.hours}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, fontStyle: "italic", color: YELLOW, lineHeight: 1.2, marginTop: 2 }}>
          {data.label}
        </div>
      </div>
    </div>
  );
}

function Phone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24">
      <path
        fill={DARK}
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      />
    </svg>
  );
}

function Pin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24">
      <path
        fill={YELLOW}
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      />
    </svg>
  );
}

function Footer({ fit }: { fit: Fit }) {
  const callW = 410;
  const divider: CSSProperties = { width: 2, height: 84, background: "rgba(255,255,255,0.55)" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: POSTER_W,
        height: FOOTER_H,
        padding: `0 ${PAD}px`,
        background: RED,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: callW }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 62,
            height: 62,
            borderRadius: 31,
            background: YELLOW,
            marginRight: 14,
          }}
        >
          <Phone />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: callW - 76 }}>
          <div style={{ fontSize: fit(TEXT.callLabel, callW - 76, 18, "extrabold"), fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
            {TEXT.callLabel}
          </div>
          <div style={{ fontSize: fit(TEXT.phones, callW - 76, 30, "extrabold"), fontWeight: 800, color: YELLOW, lineHeight: 1.2 }}>
            {TEXT.phones}
          </div>
        </div>
      </div>
      <div style={divider} />
      <div style={{ display: "flex", alignItems: "center", width: 342 }}>
        <Pin />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 8, width: 282 }}>
          <div style={{ fontSize: fit(TEXT.addressLine1, 282, 21, "semibold"), fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
            {TEXT.addressLine1}
          </div>
          <div style={{ fontSize: fit(TEXT.addressLine2, 282, 21, "semibold"), fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
            {TEXT.addressLine2}
          </div>
        </div>
      </div>
      <div style={divider} />
      <div style={{ display: "flex", alignItems: "center", width: 190 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 66,
            height: 66,
            borderRadius: 12,
            background: YELLOW,
            color: DARK,
            fontSize: 52,
            fontWeight: 800,
            marginRight: 12,
          }}
        >
          P
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: YELLOW, fontWeight: 800, fontStyle: "italic" }}>
          <div style={{ fontSize: 28, lineHeight: 1.05 }}>{TEXT.parkingTop}</div>
          <div style={{ fontSize: 28, lineHeight: 1.05 }}>{TEXT.parkingBottom}</div>
        </div>
      </div>
    </div>
  );
}

function LeftColumn({ fit, collage }: { fit: Fit; collage: string }) {
  const titleSize = fit("BUFFET", LEFT_W, 150, "extrabolditalic");
  const topSize = fit("ALL-WEEK", LEFT_W, 120, "extrabolditalic");
  const title: CSSProperties = { fontWeight: 800, fontStyle: "italic", color: RED, letterSpacing: -2 };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: LEFT_W,
        height: CONTENT_H,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ ...title, fontSize: topSize, lineHeight: 0.95 }}>ALL-WEEK</div>
        <div style={{ ...title, fontSize: titleSize, lineHeight: 0.95 }}>UNLI</div>
        <div style={{ ...title, fontSize: titleSize, lineHeight: 0.95 }}>BUFFET</div>
        <div
          style={{
            fontSize: fit(TEXT.tagline, LEFT_W, 23, "semibold"),
            fontWeight: 600,
            color: INK,
            marginTop: 10,
            lineHeight: 1.2,
          }}
        >
          {TEXT.tagline}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <PriceBanner data={TEXT.weekday} color={DARK} fit={fit} />
        <div style={{ display: "flex", marginTop: 10 }}>
          <PriceBanner data={TEXT.weekend} color={RED} fit={fit} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            width: LEFT_W,
            height: 42,
            background: DARK,
            borderRadius: 4,
          }}
        >
          <Star />
          <div
            style={{
              fontSize: fit(TEXT.vat, LEFT_W - 90, 16, "semibold"),
              fontWeight: 600,
              color: "#fff",
              margin: "0 10px",
            }}
          >
            {TEXT.vat}
          </div>
          <Star />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: LEFT_W,
          height: 76,
          background: RED,
          border: `4px solid ${YELLOW}`,
          borderRadius: 8,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: fit(TEXT.freeBucket, LEFT_W - 40, 34, "extrabolditalic"),
            fontWeight: 800,
            fontStyle: "italic",
            color: YELLOW,
          }}
        >
          {TEXT.freeBucket}
        </div>
      </div>

      <div style={{ display: "flex", width: COLLAGE_W, height: COLLAGE_H, borderRadius: 18, overflow: "hidden" }}>
        <img src={collage} alt="" width={COLLAGE_W} height={COLLAGE_H} />
      </div>
    </div>
  );
}

function MenuCard({ layout }: { layout: MenuLayout }) {
  const f = layout.fontSize;
  const hs = headSize(f);
  return (
    <div
      style={{
        display: "flex",
        width: RIGHT_W,
        height: CARD_H,
        border: `${CARD_BORDER}px solid ${RED}`,
        borderRadius: 22,
        padding: CARD_PAD,
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      {layout.columns.map((column, ci) => (
        <div
          key={ci}
          style={{
            display: "flex",
            flexDirection: "column",
            // Sections are spread down the card, like the printed sign, so a shorter column is not left half empty.
            justifyContent: "space-between",
            width: COLUMN_W,
            height: CARD_INNER_H,
            marginLeft: ci === 0 ? 0 : COLUMN_GAP,
          }}
        >
          {column.map((group, gi) => (
            <div
              key={`${group.category}-${gi}`}
              style={{ display: "flex", flexDirection: "column", marginTop: gi === 0 ? 0 : groupGap(f) }}
            >
              <div
                style={{
                  fontSize: hs,
                  fontWeight: 800,
                  color: RED,
                  lineHeight: HEAD_LINE,
                  paddingBottom: headPadBottom(f),
                  marginBottom: headMarginBottom(f),
                  borderBottom: `${HEAD_RULE}px solid ${RED}`,
                }}
              >
                {group.category}
              </div>
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
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: POSTER_W,
        height: POSTER_H,
        background: "#ffffff",
        fontFamily: "Poppins",
      }}
    >
      {children}
    </div>
  );
}

export default function PosterTemplate({ date, layout, logo, collage, fit }: PosterProps) {
  const dateText = `${date.short} • ${date.weekday}`;
  const dateW = RIGHT_W - 20;

  return (
    <Frame>
      <div
        style={{
          display: "flex",
          width: POSTER_W,
          height: POSTER_H - FOOTER_H,
          padding: `${PAD}px ${PAD}px ${BODY_BOTTOM_GAP}px ${PAD}px`,
          boxSizing: "border-box",
        }}
      >
        <LeftColumn fit={fit} collage={collage} />

        <div style={{ display: "flex", flexDirection: "column", width: RIGHT_W, marginLeft: COL_GAP }}>
          <div style={{ display: "flex", justifyContent: "center", width: RIGHT_W, height: LOGO_H }}>
            <img src={logo} alt="" width={LOGO_W} height={LOGO_H} />
          </div>
          <div style={{ display: "flex", position: "relative", width: dateW, height: DATE_H, marginTop: 10, marginLeft: 10, marginBottom: 18 }}>
            <Slant width={dateW} height={DATE_H} color={RED} skew={22} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: dateW,
                height: DATE_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontStyle: "italic",
                color: "#fff",
                fontSize: fit(dateText, dateW - 90, 40, "extrabolditalic"),
              }}
            >
              {dateText}
            </div>
          </div>
          <MenuCard layout={layout} />
        </div>
      </div>
      <Footer fit={fit} />
    </Frame>
  );
}

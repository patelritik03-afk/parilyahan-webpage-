"use client";

import type { PublicPrize, SpinLang } from "@/lib/spin/text";

const R = 200; // wheel radius in SVG units (the SVG is 480 wide with the rim and lights)
const C = 240; // centre

function point(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  // Rounded so the server and the browser produce exactly the same numbers (no hydration warning).
  const round = (n: number) => Math.round(n * 100) / 100;
  return [round(C + radius * Math.cos(a)), round(C + radius * Math.sin(a))] as const;
}

function slicePath(start: number, end: number) {
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

// Breaks "PINAS TICKET" into two lines when it is long, so it fits the slice.
function lines(text: string) {
  if (text.length <= 8 || !text.includes(" ")) return [text];
  const words = text.split(" ");
  let best = [text];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

// The angle the wheel must turn so that slice `index` stops under the pointer (at the top).
export function landingRotation(current: number, index: number, count: number, turns = 7) {
  const seg = 360 / count;
  // A random spot inside the slice (not too close to the edges) so it doesn't look staged.
  const inside = seg * (0.2 + Math.random() * 0.6);
  const target = 360 - (index * seg + inside);
  const base = current - (current % 360);
  return base + turns * 360 + target;
}

export default function Wheel({
  prizes,
  lang,
  rotation = 0,
  durationMs = 6000,
  spinning = false,
  lightsFast = false,
  idle = false,
  className = "",
}: {
  prizes: PublicPrize[];
  lang: SpinLang;
  rotation?: number;
  durationMs?: number;
  spinning?: boolean;
  lightsFast?: boolean;
  idle?: boolean;
  className?: string;
}) {
  const count = Math.max(prizes.length, 1);
  const seg = 360 / count;
  const bulbs = 24;

  return (
    <div className={`relative mx-auto aspect-square w-full ${className}`}>
      <svg viewBox="0 0 480 480" className="h-full w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]" role="img" aria-label="Prize wheel">
        <defs>
          <radialGradient id="psk-rim" cx="50%" cy="50%" r="50%">
            <stop offset="86%" stopColor="#fde68a" />
            <stop offset="93%" stopColor="#d4a017" />
            <stop offset="100%" stopColor="#8a6100" />
          </radialGradient>
          <radialGradient id="psk-gloss" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="psk-hub" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fff7d1" />
            <stop offset="55%" stopColor="#f2c230" />
            <stop offset="100%" stopColor="#a87400" />
          </radialGradient>
          <linearGradient id="psk-jackpot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Gold rim with flashing bulbs (the rim does not turn) */}
        <circle cx={C} cy={C} r={236} fill="url(#psk-rim)" />
        <circle cx={C} cy={C} r={214} fill="#3b0a0e" />
        {Array.from({ length: bulbs }, (_, i) => {
          const [x, y] = point((i * 360) / bulbs, 225);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={6.5}
              className={`psk-bulb ${i % 2 ? "psk-bulb-b" : "psk-bulb-a"} ${lightsFast ? "psk-bulb-fast" : ""}`}
            />
          );
        })}

        {/* The turning part */}
        <g
          className={idle ? "psk-wheel-idle" : undefined}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${C}px ${C}px`,
            transition: spinning ? `transform ${durationMs}ms cubic-bezier(0.12, 0.72, 0.08, 1)` : "none",
          }}
        >
          {prizes.map((p, i) => {
            const start = i * seg;
            const mid = start + seg / 2;
            const label = lang === "tl" ? p.short_tl : p.short_en;
            const textLines = lines(label);
            return (
              <g key={p.position}>
                <path d={slicePath(start, start + seg)} fill={p.color} stroke="#fde68a" strokeWidth={3} />
                {p.is_jackpot && <path d={slicePath(start, start + seg)} fill="url(#psk-jackpot)" />}
                <g transform={`rotate(${mid} ${C} ${C})`}>
                  <text x={C} y={C - R * 0.74} textAnchor="middle" dominantBaseline="middle" fontSize={34}>
                    {p.emoji}
                  </text>
                  {textLines.map((line, li) => (
                    <text
                      key={li}
                      x={C}
                      y={C - R * 0.5 + li * 19 - (textLines.length - 1) * 9}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={line.length > 11 ? 14 : 17}
                      fontWeight={900}
                      fill="#ffffff"
                      stroke="rgba(0,0,0,0.35)"
                      strokeWidth={3}
                      paintOrder="stroke"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {line}
                    </text>
                  ))}
                  {p.is_jackpot && (
                    <text x={C} y={C - R * 0.27} textAnchor="middle" dominantBaseline="middle" fontSize={13}>
                      ⭐
                    </text>
                  )}
                </g>
              </g>
            );
          })}
          <circle cx={C} cy={C} r={R} fill="url(#psk-gloss)" pointerEvents="none" />
        </g>

        {/* Hub with the Filipino sun */}
        <circle cx={C} cy={C} r={44} fill="url(#psk-hub)" stroke="#7a5200" strokeWidth={3} />
        <g transform={`translate(${C} ${C})`} fill="#c1121f" opacity={0.9}>
          {Array.from({ length: 8 }, (_, i) => (
            <polygon key={i} points="0,-30 4,-16 -4,-16" transform={`rotate(${i * 45})`} />
          ))}
          <circle r={13} />
        </g>

        {/* Pointer at the top */}
        <g filter="drop-shadow(0 3px 3px rgba(0,0,0,0.5))">
          <path d={`M ${C - 22} 6 L ${C + 22} 6 L ${C} 58 Z`} fill="#fde68a" stroke="#8a6100" strokeWidth={3} strokeLinejoin="round" />
          <circle cx={C} cy={16} r={7} fill="#c1121f" />
        </g>
      </svg>
      <style>{`
        .psk-bulb { fill: #fff6c2; }
        .psk-bulb-a { animation: psk-blink 1.1s steps(1) infinite; }
        .psk-bulb-b { animation: psk-blink 1.1s steps(1) infinite 0.55s; }
        .psk-bulb-fast { animation-duration: 0.28s; }
        .psk-bulb-b.psk-bulb-fast { animation-delay: 0.14s; }
        @keyframes psk-blink { 0% { fill: #fff6c2; filter: drop-shadow(0 0 5px #ffe066); } 50% { fill: #b8860b; filter: none; } }
        .psk-wheel-idle { animation: psk-wheel-turn 50s linear infinite; }
        @keyframes psk-wheel-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .psk-bulb, .psk-wheel-idle { animation: none !important; } }
      `}</style>
    </div>
  );
}

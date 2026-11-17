"use client";

// Small sound + confetti helpers for the wheel (no libraries, nothing to download).

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// Call from a tap so the browser allows sound later.
export function unlockAudio() {
  audio();
}

function beep(freq: number, ms: number, type: OscillatorType = "square", gain = 0.06, delay = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

export function tick() {
  beep(1500, 35, "square", 0.035);
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(6);
}

export function fanfare(jackpot: boolean) {
  const notes = jackpot ? [523, 659, 784, 1047, 784, 1047, 1319] : [523, 659, 784, 1047];
  notes.forEach((f, i) => beep(f, 220, "triangle", 0.09, i * 0.13));
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(jackpot ? [80, 60, 80, 60, 200] : [60, 40, 120]);
}

// A burst of confetti on a full-screen canvas that removes itself.
export function confetti(jackpot = false) {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:100";
  document.body.appendChild(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const c = canvas.getContext("2d");
  if (!c) return canvas.remove();
  c.scale(dpr, dpr);
  const colors = jackpot ? ["#ffd700", "#fff3a0", "#f2c230", "#ffffff", "#c1121f"] : ["#ffd700", "#c1121f", "#1d3c8f", "#2a9d4b", "#ffffff", "#e85d04"];
  const W = window.innerWidth;
  const H = window.innerHeight;
  const parts = Array.from({ length: jackpot ? 260 : 160 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.45,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 17 - 6,
    size: 6 + Math.random() * 7,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (now: number) => {
    const elapsed = now - start;
    c.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.38;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.globalAlpha = Math.max(0, 1 - elapsed / 4200);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    }
    if (elapsed < 4200) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

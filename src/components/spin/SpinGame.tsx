"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { COUNTRY_CODES, DEFAULT_DIAL_CODE, buildPhone } from "@/lib/countryCodes";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { HONEYPOT_FIELD } from "@/lib/validation";
import { SPIN_TEXT, type PublicCampaign, type SpinLang } from "@/lib/spin/text";
import Wheel, { landingRotation } from "./Wheel";
import Keypad from "./Keypad";
import { confetti, fanfare, tick, unlockAudio } from "./effects";

type Step = "intro" | "name" | "phone" | "verify" | "spin" | "result" | "already";
type Verify = { token: string; mode: PublicCampaign["verify_mode"]; message?: string; waLink?: string };
type Win = {
  position: number;
  code: string;
  expiresOn: string;
  jackpot: boolean;
  whatsappSent: boolean;
  prize: { emoji: string; label_en: string; label_tl: string } | null;
};

const SPIN_MS = 6500;
const IDLE_RESET_MS = 60_000;
const RESULT_RESET_MS = 20_000;

const fmtDate = (iso: string, lang: SpinLang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "tl" ? "fil-PH" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

// A verification in progress is remembered for a while, so a player who comes back from WhatsApp
// (even in another tab, or after the phone reloaded the page) carries on where they were.
const PENDING_KEY = "psk_spin_pending";
const PENDING_MS = 15 * 60_000;
function savePending(v: Verify | null) {
  try {
    if (v) localStorage.setItem(PENDING_KEY, JSON.stringify({ ...v, at: Date.now() }));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // storage blocked: the page still works while it stays open
  }
}
function loadPending(): Verify | null {
  try {
    const v = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "null");
    if (v?.token && Date.now() - Number(v.at) < PENDING_MS) return v as Verify;
  } catch {
    // ignore
  }
  return null;
}

// Ease-out with a long, dramatic slow-down at the end.
const ease = (t: number) => 1 - Math.pow(1 - t, 4.2);

export default function SpinGame({ campaign, source, kiosk = false }: { campaign: PublicCampaign | null; source: string; kiosk?: boolean }) {
  const { lang, setLang } = useLanguage();
  const T = SPIN_TEXT[lang];
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [dial, setDial] = useState(DEFAULT_DIAL_CODE);
  const [national, setNational] = useState("");
  const [terms, setTerms] = useState(false);
  const [offers, setOffers] = useState(true);
  const [trap, setTrap] = useState("");
  const [verify, setVerify] = useState<Verify | null>(null);
  const [typed, setTyped] = useState(false);
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState<Win | null>(null);
  const [alreadyAt, setAlreadyAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const lastActivity = useRef(0);
  const [countdown, setCountdown] = useState(0);

  const prizes = campaign?.prizes ?? [];
  const running = Boolean(campaign?.running);

  const [nudge, setNudge] = useState(0);

  const reset = useCallback(() => {
    savePending(null);
    setStep("intro");
    setName("");
    setDial(DEFAULT_DIAL_CODE);
    setNational("");
    setTerms(false);
    setOffers(true);
    setVerify(null);
    setTyped(false);
    setCode("");
    setInfo("");
    setError("");
    setExpired(false);
    setWin(null);
    setAlreadyAt(null);
    setCopied(false);
    setShowTerms(false);
  }, []);

  // Restaurant screen: start over when nobody touches it, and soon after a result.
  useEffect(() => {
    if (!kiosk) return;
    const touch = () => (lastActivity.current = Date.now());
    touch();
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    const timer = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      setCountdown(Math.max(0, Math.ceil((RESULT_RESET_MS - idle) / 1000)));
      if (spinning) return;
      const limit = step === "result" || step === "already" ? RESULT_RESET_MS : IDLE_RESET_MS;
      if (step !== "intro" && idle > limit) reset();
    }, 1000);
    return () => {
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      clearInterval(timer);
    };
  }, [kiosk, step, spinning, reset]);

  // Restaurant screen: keep the display awake, and pick up admin changes by reloading now and then while idle.
  useEffect(() => {
    if (!kiosk) return;
    const loaded = Date.now();
    let lock: { release: () => Promise<void> } | null = null;
    const wake = async () => {
      try {
        lock = await (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen") ?? null;
      } catch {
        // not supported; the screen's own power settings apply
      }
    };
    wake();
    const onVisible = () => document.visibilityState === "visible" && wake();
    document.addEventListener("visibilitychange", onVisible);
    const reload = setInterval(() => {
      if (Date.now() - loaded > 30 * 60_000 && Date.now() - lastActivity.current > IDLE_RESET_MS) window.location.reload();
    }, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(reload);
      lock?.release().catch(() => {});
    };
  }, [kiosk]);

  // Coming back to /spin with a verification still open: continue it (not on the restaurant screen).
  useEffect(() => {
    if (kiosk) return;
    const pending = loadPending();
    if (!pending) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the player's progress once on open
    setVerify(pending);
    setTyped(pending.mode === "typed");
    setStep("verify");
  }, [kiosk]);

  async function start() {
    setBusy(true);
    setError("");
    setExpired(false);
    try {
      const res = await fetch("/api/spin/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: buildPhone(dial, national).full,
          terms,
          offers,
          source,
          kiosk,
          [HONEYPOT_FIELD]: trap,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error === "not-running" ? T.notRunning : json.error ?? T.error);
        return;
      }
      if (json.already) {
        savePending(null);
        setAlreadyAt(json.wonAt ?? null);
        setStep("already");
        return;
      }
      const next: Verify = { token: json.token, mode: json.mode, message: json.message, waLink: json.waLink };
      setVerify(next);
      if (!kiosk) savePending(next);
      setTyped(json.mode === "typed");
      setInfo(json.mode === "typed" ? T.codeSent : "");
      setCode("");
      setStep("verify");
    } catch {
      setError(T.error);
    } finally {
      setBusy(false);
    }
  }

  // Waiting for the customer's WhatsApp message (checked every 2 seconds and when they come back to this tab).
  useEffect(() => {
    if (step !== "verify" || !verify || expired) return;
    let stop = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/spin/status?token=${encodeURIComponent(verify.token)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (stop) return;
        if (json.verified) {
          setInfo(T.verified);
          setError("");
          setStep("spin");
        } else if (json.expired) setExpired(true);
        else if (json.error === "bad-token") reset();
      } catch {
        // try again on the next tick
      }
    };
    check();
    const timer = setInterval(check, 2000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [step, verify, expired, nudge, reset, T.verified]);

  async function sendCode() {
    if (!verify) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/spin/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verify.token }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setTyped(true);
      setInfo(T.codeSent);
      setExpired(false);
    } else setError(json.error ?? T.error);
  }

  async function checkCode() {
    if (!verify) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/spin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verify.token, code }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && json.verified) {
      setInfo(T.verified);
      setStep("spin");
    } else if (json.error === "expired") setExpired(true);
    else if (json.error === "too-many") setError(T.tooMany);
    else setError(T.wrongCode);
  }

  async function spin() {
    if (!verify || spinning || busy) return;
    unlockAudio();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/spin/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verify.token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === "already") {
          savePending(null);
          setStep("already");
        } else if (json.error === "not-verified") {
          setStep("verify");
        } else setError(json.error === "not-running" ? T.notRunning : T.error);
        return;
      }
      const result = json as Win;
      const index = Math.max(0, prizes.findIndex((p) => p.position === result.position));
      const from = rotation;
      const to = landingRotation(from, index, prizes.length || 1);
      const seg = 360 / (prizes.length || 1);
      setSpinning(true);
      setInfo("");
      const began = performance.now();
      let lastSlice = Math.floor(from / seg);
      await new Promise<void>((done) => {
        const frame = (now: number) => {
          const t = Math.min(1, (now - began) / SPIN_MS);
          const angle = from + (to - from) * ease(t);
          setRotation(angle);
          const slice = Math.floor(angle / seg);
          if (slice !== lastSlice) {
            lastSlice = slice;
            tick();
          }
          if (t < 1) requestAnimationFrame(frame);
          else done();
        };
        requestAnimationFrame(frame);
      });
      setWin(result);
      savePending(null);
      fanfare(result.jackpot);
      confetti(result.jackpot);
      if (result.jackpot) setTimeout(() => confetti(true), 900);
      setTimeout(() => setStep("result"), 700);
      lastActivity.current = Date.now();
    } catch {
      setError(T.error);
    } finally {
      setSpinning(false);
      setBusy(false);
    }
  }

  function copyCode() {
    if (!win) return;
    navigator.clipboard?.writeText(win.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const big = kiosk ? "text-2xl" : "text-lg";
  const box =
    "rounded-2xl border-2 border-amber-300/60 bg-white px-4 py-3 text-lg font-semibold text-[#14213d] placeholder:text-slate-400 focus:border-amber-400 focus:outline-none";
  const input = `${box} w-full`;
  const goldBtn =
    "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ffe27a] to-[#f2b705] px-8 py-4 font-black uppercase tracking-wide text-[#5a1a00] shadow-[0_6px_0_#a86f00,0_14px_30px_rgba(0,0,0,0.35)] transition active:translate-y-1 active:shadow-[0_2px_0_#a86f00] disabled:opacity-60";
  const ghostBtn = "text-sm font-semibold text-white/80 underline-offset-4 hover:underline";
  const phoneOk = buildPhone(dial, national).digits.length >= 5;
  const prizeText = (p: { label_en: string; label_tl: string }) => (lang === "tl" ? p.label_tl : p.label_en);
  const waNumber = verify?.waLink?.match(/wa\.me\/(\d+)/)?.[1];

  return (
    <section
      className={`relative overflow-hidden text-white ${kiosk ? "min-h-screen" : "min-h-[calc(100vh-64px)]"}`}
      style={{
        background:
          "radial-gradient(ellipse at 50% -10%, rgba(255,215,0,0.28), transparent 55%), radial-gradient(circle at 10% 90%, rgba(29,60,143,0.9), transparent 50%), linear-gradient(160deg, #7a0d14 0%, #3b0a0e 45%, #14213d 100%)",
      }}
    >
      {/* Sun and stars from the Philippine flag, as soft background shapes */}
      <svg aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 opacity-15" viewBox="-50 -50 100 100">
        {Array.from({ length: 8 }, (_, i) => (
          <polygon key={i} points="0,-48 6,-20 -6,-20" fill="#ffd700" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="18" fill="#ffd700" />
      </svg>
      {[
        [8, 12],
        [88, 70],
        [16, 78],
      ].map(([x, y], i) => (
        <span key={i} aria-hidden className="pointer-events-none absolute text-2xl text-amber-300/30" style={{ left: `${x}%`, top: `${y}%` }}>
          ★
        </span>
      ))}

      <div className={`relative mx-auto px-4 py-6 ${kiosk ? "max-w-3xl py-10" : "max-w-md sm:max-w-lg"}`}>
        {/* Language switch */}
        <div className="mb-4 flex items-center justify-between">
          {step !== "intro" && !spinning && step !== "result" ? (
            <button
              type="button"
              className={ghostBtn}
              onClick={() => {
                setError("");
                setStep(step === "phone" ? "name" : step === "verify" ? "phone" : "intro");
              }}
            >
              ← {T.back}
            </button>
          ) : (
            <span />
          )}
          <div className="flex rounded-full bg-black/25 p-1 text-sm font-bold">
            {(["en", "tl"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1 ${lang === l ? "bg-amber-300 text-[#5a1a00]" : "text-white/80"}`}
              >
                {l === "en" ? "EN" : "TL"}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        {(step === "intro" || step === "spin") && (
          <header className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200/90">{T.eyebrow}</p>
            <h1
              className={`mt-2 font-black leading-none tracking-tight ${kiosk ? "text-7xl" : "text-5xl sm:text-6xl"}`}
              style={{
                background: "linear-gradient(180deg,#fff7c2 0%,#ffd700 45%,#e09b00 100%)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 4px 0 rgba(90,26,0,0.8))",
              }}
            >
              {T.title} <span style={{ WebkitTextFillColor: "initial" }}>🎡</span>
            </h1>
            {step === "intro" && (
              <>
                <p className={`mt-3 font-semibold text-white/90 ${big}`}>{T.subtitle}</p>
                <p className="mx-auto mt-3 inline-block rounded-full bg-black/30 px-4 py-2 text-sm font-bold text-amber-200 ring-1 ring-amber-300/40">
                  {T.teaser}
                </p>
              </>
            )}
          </header>
        )}

        {/* Wheel (intro idles slowly; spin step is the real one) */}
        {(step === "intro" || step === "spin") && prizes.length > 0 && (
          <div className={`mx-auto mt-6 ${kiosk ? "max-w-[560px]" : "max-w-[400px]"}`}>
            <Wheel prizes={prizes} lang={lang} rotation={rotation} lightsFast={spinning} idle={step === "intro"} />
          </div>
        )}

        {step === "intro" && (
          <div className="mt-6 space-y-5 text-center">
            {running ? (
              <button type="button" className={`${goldBtn} ${kiosk ? "text-3xl" : "text-xl"}`} onClick={() => (unlockAudio(), setStep("name"))}>
                {T.start} 🎉
              </button>
            ) : (
              <p className="rounded-2xl bg-black/30 p-4 font-semibold">
                {campaign && campaign.starts_on > new Date().toISOString().slice(0, 10)
                  ? `${T.startsOn} ${fmtDate(campaign.starts_on, lang)} 🎉`
                  : T.notRunning}
              </p>
            )}
            {running && campaign && (
              <p className="text-sm text-white/70">
                {T.endsOn} {fmtDate(campaign.ends_on, lang)}
              </p>
            )}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-200">{T.prizesTitle}</h2>
              <ul className="mt-3 grid gap-2 text-left">
                {[...prizes]
                  .sort((a, b) => Number(b.is_jackpot) - Number(a.is_jackpot))
                  .map((p) => (
                    <li
                      key={p.position}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold ${
                        p.is_jackpot ? "bg-gradient-to-r from-amber-300/30 to-amber-100/10 ring-1 ring-amber-300/60" : "bg-white/10"
                      }`}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="flex-1">{prizeText(p)}</span>
                      {p.is_jackpot && <span className="text-xs font-black text-amber-300">★ JACKPOT</span>}
                    </li>
                  ))}
              </ul>
              <p className="mt-3 text-xs text-white/60">{T.oddsNote}</p>
            </div>
            {campaign?.terms && (
              <div>
                <button type="button" className={ghostBtn} onClick={() => setShowTerms((v) => !v)}>
                  {T.terms}
                </button>
                {showTerms && <p className="mt-2 whitespace-pre-line rounded-2xl bg-black/30 p-4 text-left text-xs leading-relaxed text-white/80">{campaign.terms}</p>}
              </div>
            )}
          </div>
        )}

        {step === "name" && (
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length >= 2) setStep("phone");
            }}
          >
            <StepDots step={1} />
            <h2 className={`text-center font-black ${kiosk ? "text-4xl" : "text-3xl"}`}>{T.stepName}</h2>
            <input
              className={input}
              autoFocus={!kiosk}
              autoComplete="name"
              inputMode={kiosk ? "none" : "text"}
              maxLength={80}
              placeholder={T.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {kiosk && <Keypad mode="letters" value={name} onChange={setName} />}
            <button type="submit" className={`${goldBtn} text-xl`} disabled={name.trim().length < 2}>
              {T.next} →
            </button>
          </form>
        )}

        {step === "phone" && (
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (phoneOk && terms && !busy) start();
            }}
          >
            <StepDots step={2} />
            <h2 className={`text-center font-black ${kiosk ? "text-4xl" : "text-3xl"}`}>{T.stepPhone}</h2>
            <p className="text-center text-sm text-white/75">{T.phoneHint}</p>
            <div className="flex gap-2">
              <select
                aria-label="Country code"
                className={`${box} w-28 shrink-0 px-2 text-base`}
                value={dial}
                onChange={(e) => setDial(e.target.value)}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.name} value={c.dial}>
                    {c.name} {c.dial}
                  </option>
                ))}
              </select>
              <input
                className={`${box} w-0 min-w-0 flex-1 tabular-nums`}
                type="tel"
                autoFocus={!kiosk}
                inputMode={kiosk ? "none" : "numeric"}
                autoComplete="tel-national"
                placeholder="50 123 4567"
                value={national}
                onChange={(e) => setNational(e.target.value.replace(/[^\d ]/g, "").slice(0, 16))}
              />
            </div>
            {kiosk && <Keypad mode="digits" value={national} onChange={(v) => setNational(v.slice(0, 16))} max={16} />}
            <input
              type="text"
              name={HONEYPOT_FIELD}
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <label className="flex items-start gap-3 text-sm font-medium">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                {T.agreeTerms}
                {campaign?.terms && (
                  <>
                    {" "}
                    (
                    <button type="button" className="underline" onClick={() => setShowTerms((v) => !v)}>
                      {T.terms}
                    </button>
                    )
                  </>
                )}
              </span>
            </label>
            {showTerms && campaign?.terms && (
              <p className="max-h-48 overflow-y-auto whitespace-pre-line rounded-2xl bg-black/30 p-4 text-xs leading-relaxed text-white/80">{campaign.terms}</p>
            )}
            <label className="flex items-start gap-3 text-sm font-medium">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400" checked={offers} onChange={(e) => setOffers(e.target.checked)} />
              <span>{T.agreeOffers}</span>
            </label>
            {error && <p className="rounded-xl bg-red-950/60 p-3 text-center text-sm font-semibold">{error}</p>}
            <button type="submit" className={`${goldBtn} text-xl`} disabled={!phoneOk || !terms || busy}>
              {busy ? "…" : `${T.continue} →`}
            </button>
          </form>
        )}

        {step === "verify" && verify && (
          <div className="mt-6 space-y-5 text-center">
            <StepDots step={3} />
            <h2 className={`font-black ${kiosk ? "text-4xl" : "text-3xl"}`}>{T.stepVerify}</h2>
            {expired ? (
              <div className="space-y-4">
                <p className="rounded-xl bg-red-950/60 p-3 font-semibold">{T.expired}</p>
                <button type="button" className={`${goldBtn} text-lg`} disabled={busy} onClick={start}>
                  {T.startAgain}
                </button>
              </div>
            ) : typed ? (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.length === 6) checkCode();
                }}
              >
                <p className="text-white/85">{T.typedTitle}</p>
                {info && <p className="text-sm font-semibold text-green-300">{info}</p>}
                <input
                  className={`${input} text-center text-3xl tracking-[0.5em] tabular-nums`}
                  inputMode={kiosk ? "none" : "numeric"}
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus={!kiosk}
                />
                {kiosk && <Keypad mode="digits" value={code} onChange={(v) => setCode(v.slice(0, 6))} max={6} />}
                <button type="submit" className={`${goldBtn} text-xl`} disabled={code.length !== 6 || busy}>
                  {T.checkCode}
                </button>
              </form>
            ) : kiosk ? (
              <div className="space-y-4">
                <p className="text-xl text-white/90">{T.verifyKiosk}</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG for this player only */}
                <img
                  src={`/api/spin/qr?token=${encodeURIComponent(verify.token)}`}
                  alt="WhatsApp QR code"
                  className="mx-auto h-72 w-72 rounded-3xl bg-white p-4 shadow-2xl"
                />
                <p className="text-sm text-white/70">{T.verifyCodeLabel}</p>
                <p className="font-mono text-4xl font-black tracking-widest text-amber-200">{verify.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/90">{T.verifyPhone}</p>
                {/* Same tab: WhatsApp opens on top, and coming back lands on this page again. */}
                <a
                  href={verify.waLink}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-xl font-black text-white shadow-[0_6px_0_#128C7E,0_14px_30px_rgba(0,0,0,0.35)] active:translate-y-1"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
                  </svg>
                  {T.verifyButton}
                </a>
                {verify.message && waNumber && (
                  <p className="text-xs text-white/65">
                    {T.notOpening} <b className="font-mono text-white">{verify.message}</b> {T.to} +{waNumber}
                  </p>
                )}
                {verify.mode === "both" && (
                  <button type="button" className={ghostBtn} disabled={busy} onClick={sendCode}>
                    {T.sendCode}
                  </button>
                )}
              </div>
            )}
            {!expired && !typed && (
              <>
                <p className="flex items-center justify-center gap-2 text-sm text-white/75">
                  <span className="inline-block h-3 w-3 animate-ping rounded-full bg-green-400" />
                  {T.waiting}
                </p>
                {!kiosk && (
                  <button
                    type="button"
                    onClick={() => setNudge((n) => n + 1)}
                    className="w-full rounded-full border-2 border-white/40 px-6 py-3 font-bold text-white hover:bg-white/10"
                  >
                    {T.sentIt}
                  </button>
                )}
              </>
            )}
            {error && <p className="rounded-xl bg-red-950/60 p-3 text-sm font-semibold">{error}</p>}
          </div>
        )}

        {step === "spin" && (
          <div className="mt-6 space-y-4 text-center">
            {info && !spinning && <p className="font-bold text-green-300">{info}</p>}
            <button
              type="button"
              className={`${goldBtn} ${kiosk ? "text-4xl" : "text-3xl"} ${!spinning && !busy ? "animate-[psk-pulse_1.2s_ease-in-out_infinite]" : ""}`}
              disabled={spinning || busy}
              onClick={spin}
            >
              {spinning ? T.spinning : `${T.spin} 🎰`}
            </button>
            {error && <p className="rounded-xl bg-red-950/60 p-3 text-sm font-semibold">{error}</p>}
          </div>
        )}

        {step === "result" && win && (
          <div className="mt-4 space-y-5 text-center">
            <p
              className={`font-black uppercase tracking-tight ${kiosk ? "text-7xl" : "text-5xl"} ${win.jackpot ? "animate-[psk-pulse_0.9s_ease-in-out_infinite]" : ""}`}
              style={{
                background: "linear-gradient(180deg,#fff7c2 0%,#ffd700 45%,#e09b00 100%)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 4px 0 rgba(90,26,0,0.8))",
              }}
            >
              {win.jackpot ? `★ ${T.jackpot} ★` : T.youWon}
            </p>
            <div className={`${kiosk ? "text-9xl" : "text-8xl"} leading-none`}>{win.prize?.emoji}</div>
            <p className={`font-black ${kiosk ? "text-4xl" : "text-3xl"}`}>{win.prize ? prizeText(win.prize) : ""}</p>

            <div className="mx-auto max-w-sm rounded-3xl border-2 border-dashed border-amber-300 bg-white p-5 text-[#14213d] shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{T.yourCode}</p>
              <p className="mt-1 font-mono text-3xl font-black tracking-wider">{win.code}</p>
              {!kiosk && (
                <button type="button" onClick={copyCode} className="mt-3 rounded-full bg-[#14213d] px-6 py-2 text-sm font-bold text-white">
                  {copied ? `✅ ${T.copied}` : `📋 ${T.copy}`}
                </button>
              )}
              <p className="mt-3 text-sm font-semibold">
                {T.validUntil} {fmtDate(win.expiresOn, lang)}
              </p>
            </div>
            {win.whatsappSent && <p className="font-semibold text-green-300">{T.sentWhatsApp}</p>}
            <p className="text-sm text-white/75">{T.showCounter}</p>
            {kiosk ? (
              <button type="button" className={`${goldBtn} text-2xl`} onClick={reset}>
                {T.playAgainKiosk} ({countdown})
              </button>
            ) : (
              <Link href={`/reservation?coupon=${win.code}`} className={`${goldBtn} text-lg`}>
                {T.bookTable} 🍽️
              </Link>
            )}
          </div>
        )}

        {step === "already" && (
          <div className="mt-10 space-y-5 text-center">
            <div className="text-7xl">🎉</div>
            <h2 className={`font-black ${kiosk ? "text-4xl" : "text-3xl"}`}>{T.already}</h2>
            {alreadyAt && <p className="text-white/75">{new Date(alreadyAt).toLocaleDateString(lang === "tl" ? "fil-PH" : "en-GB", { day: "numeric", month: "long" })}</p>}
            <p className="text-white/85">{T.alreadyNote}</p>
            {kiosk ? (
              <button type="button" className={`${goldBtn} text-2xl`} onClick={reset}>
                {T.playAgainKiosk}
              </button>
            ) : (
              <Link href="/reservation" className={`${goldBtn} text-lg`}>
                {T.bookTable} 🍽️
              </Link>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes psk-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>
    </section>
  );
}

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-2.5 rounded-full transition-all ${n <= step ? "w-8 bg-amber-300" : "w-2.5 bg-white/30"}`} />
      ))}
    </div>
  );
}

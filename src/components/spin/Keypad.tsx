"use client";

// On-screen keys for the restaurant screen (touch screens often have no keyboard).
const LETTERS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const key =
  "flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl bg-white/15 text-xl font-bold text-white active:scale-95 active:bg-white/30 select-none";

export default function Keypad({
  mode,
  value,
  onChange,
  max = 80,
}: {
  mode: "letters" | "digits";
  value: string;
  onChange: (next: string) => void;
  max?: number;
}) {
  const add = (ch: string) => value.length < max && onChange(value + ch);
  const back = () => onChange(value.slice(0, -1));

  if (mode === "digits") {
    return (
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className={key} onClick={() => add(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={key} onClick={() => onChange("")}>
          C
        </button>
        <button type="button" className={key} onClick={() => add("0")}>
          0
        </button>
        <button type="button" className={key} onClick={back} aria-label="Delete">
          ⌫
        </button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {LETTERS.map((row) => (
        <div key={row} className="flex gap-1.5">
          {row.split("").map((ch) => (
            <button
              key={ch}
              type="button"
              className={key}
              onClick={() => add(value === "" || value.endsWith(" ") ? ch : ch.toLowerCase())}
            >
              {ch}
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-1.5">
        <button type="button" className={`${key} flex-[5]`} onClick={() => value && !value.endsWith(" ") && add(" ")}>
          space
        </button>
        <button type="button" className={`${key} flex-[2]`} onClick={back} aria-label="Delete">
          ⌫
        </button>
      </div>
    </div>
  );
}

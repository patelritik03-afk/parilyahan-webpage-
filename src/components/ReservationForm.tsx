"use client";

import { useState, type FormEvent } from "react";
import { todayISO } from "@/lib/date";
import { TIME_SLOTS, formatTimeLabel } from "@/lib/timeSlots";
import { buildPhone } from "@/lib/countryCodes";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { HONEYPOT_FIELD } from "@/lib/validation";
import { Field, HoneypotField, inputClass, labelClass } from "./FormField";
import PhoneField from "./PhoneField";

type Status = "idle" | "submitting" | "success" | "error";

export default function ReservationForm() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<{ date: string; time: string; party_size: number } | null>(
    null
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const phone = buildPhone(String(data.dialCode ?? ""), String(data.phone ?? ""));
    if (phone.digits.length < 5 || phone.digits.length > 14) {
      setErrorMessage(t("enquiry.invalidPhone"));
      setStatus("error");
      return;
    }
    setStatus("submitting");

    const payload = {
      name: String(data.name ?? ""),
      phone: phone.full,
      email: String(data.email ?? ""),
      date: String(data.date ?? ""),
      time: String(data.time ?? ""),
      party_size: Number(data.party_size ?? 0),
      notes: String(data.notes ?? ""),
      [HONEYPOT_FIELD]: String(data[HONEYPOT_FIELD] ?? ""),
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? t("reservation.genericError"));
      }

      setSummary({ date: payload.date, time: payload.time, party_size: payload.party_size });
      setStatus("success");
      form.reset();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("reservation.genericError"));
      setStatus("error");
    }
  }

  if (status === "success" && summary) {
    const summaryText = t("reservation.summaryTemplate")
      .replace("{date}", summary.date)
      .replace("{time}", formatTimeLabel(summary.time))
      .replace("{size}", String(summary.party_size));

    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
        <h2 className="font-display text-xl font-semibold text-primary">{t("reservation.successTitle")}</h2>
        <p className="mt-2 text-foreground/90">{summaryText}</p>
        <p className="mt-2 text-sm text-muted">{t("reservation.successNote")}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-primary underline"
        >
          {t("reservation.another")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5">
      <HoneypotField name={HONEYPOT_FIELD} />
      <Field label={t("reservation.fullName")} name="name" type="text" required />
      <PhoneField label={t("reservation.phone")} countryLabel={t("enquiry.countryCode")} />
      <Field label={t("reservation.email")} name="email" type="email" required />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={t("reservation.date")} name="date" type="date" required min={todayISO()} />
        <div>
          <label className={labelClass} htmlFor="time">
            {t("reservation.time")}
          </label>
          <select id="time" name="time" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              {t("reservation.selectTime")}
            </option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatTimeLabel(slot)}
              </option>
            ))}
          </select>
        </div>
        <Field label={t("reservation.partySize")} name="party_size" type="number" required min={1} defaultValue={2} />
      </div>
      <div>
        <label className={labelClass} htmlFor="notes">
          {t("reservation.notes")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={inputClass}
          placeholder={t("reservation.notesPlaceholder")}
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? t("reservation.submitting") : t("reservation.submit")}
      </button>
    </form>
  );
}

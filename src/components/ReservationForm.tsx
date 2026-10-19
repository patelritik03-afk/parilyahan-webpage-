"use client";

import { useState, type FormEvent } from "react";
import { todayISO } from "@/lib/date";
import { TIME_SLOTS, formatTimeLabel } from "@/lib/timeSlots";
import { buildPhone } from "@/lib/countryCodes";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { HONEYPOT_FIELD } from "@/lib/validation";
import { bookingReference, downloadReservationReceipt, type ReceiptData } from "@/lib/reservationReceipt";
import { Field, HoneypotField, inputClass, labelClass } from "./FormField";
import PhoneField from "./PhoneField";

type Status = "idle" | "submitting" | "success" | "error";

export default function ReservationForm() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<{
    date: string;
    time: string;
    party_size: number;
    hasEmail: boolean;
    receipt: ReceiptData | null;
  } | null>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptError, setReceiptError] = useState(false);

  async function handleDownloadReceipt() {
    if (!summary?.receipt) return;
    setReceiptBusy(true);
    setReceiptError(false);
    try {
      await downloadReservationReceipt(summary.receipt);
    } catch {
      setReceiptError(true);
    } finally {
      setReceiptBusy(false);
    }
  }

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

      const saved = await res.json().catch(() => null);
      const reservation = saved?.reservation;
      setSummary({
        date: payload.date,
        time: payload.time,
        party_size: payload.party_size,
        hasEmail: payload.email.trim() !== "",
        receipt: reservation?.id
          ? {
              id: String(reservation.id),
              name: payload.name.trim(),
              phone: payload.phone,
              date: payload.date,
              time: payload.time,
              party_size: payload.party_size,
              notes: payload.notes,
              created_at: reservation.created_at,
            }
          : null,
      });
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
        <p className="mt-2 text-sm text-muted">
          {summary.hasEmail ? t("reservation.successNote") : t("reservation.successNoteNoEmail")}
        </p>
        {summary.receipt && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted">
              {t("reservation.reference")}: {bookingReference(summary.receipt.id)}
            </p>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              disabled={receiptBusy}
              className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {receiptBusy ? t("reservation.receiptPreparing") : t("reservation.downloadReceipt")}
            </button>
            {receiptError && <p className="mt-2 text-sm text-red-600">{t("reservation.genericError")}</p>}
          </>
        )}
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
      <Field label={t("reservation.emailOptional")} name="email" type="email" />
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

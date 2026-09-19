"use client";

import { useState, type FormEvent } from "react";
import { todayISO } from "@/lib/date";
import { buildPhone } from "@/lib/countryCodes";
import { ENQUIRY_TYPES, EVENT_TYPES } from "@/lib/enquiry";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Field, inputClass, labelClass } from "./FormField";
import PhoneField from "./PhoneField";

type Status = "idle" | "submitting" | "success" | "error";

export default function EnquiryForm() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [type, setType] = useState("");
  const [eventType, setEventType] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const phone = buildPhone(String(data.dialCode ?? ""), String(data.phone ?? ""));
    if (phone.digits.length < 5 || phone.digits.length > 14) {
      setErrorMessage(t("enquiry.invalidPhone"));
      setStatus("error");
      return;
    }

    const payload: Record<string, unknown> = {
      name: String(data.name ?? ""),
      phone: phone.full,
      email: String(data.email ?? ""),
      type,
      message: String(data.message ?? ""),
    };
    if (type === "Other") payload.specify = String(data.specify ?? "");
    if (type === "Event") {
      payload.eventType = eventType === "Other" ? `Other: ${String(data.eventTypeOther ?? "")}` : eventType;
      payload.pax = Number(data.pax);
      payload.eventDate = String(data.eventDate ?? "");
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? t("reservation.genericError"));
      }
      setType("");
      setEventType("");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("reservation.genericError"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
        <h2 className="font-display text-xl font-semibold text-primary">{t("enquiry.successTitle")}</h2>
        <p className="mt-2 text-foreground/90">{t("enquiry.successNote")}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-primary underline"
        >
          {t("enquiry.another")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={t("reservation.fullName")} name="name" type="text" required />
      <PhoneField label={t("reservation.phone")} countryLabel={t("enquiry.countryCode")} />
      <Field label={t("reservation.email")} name="email" type="email" required />

      <div>
        <label className={labelClass} htmlFor="type">
          {t("enquiry.type")}
        </label>
        <select
          id="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            {t("enquiry.selectType")}
          </option>
          {ENQUIRY_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {t(item.key)}
            </option>
          ))}
        </select>
      </div>

      {type === "Other" && <Field label={t("enquiry.specify")} name="specify" type="text" required />}

      {type === "Event" && (
        <div className="space-y-5 rounded-lg border border-border bg-surface p-4">
          <div>
            <label className={labelClass} htmlFor="eventType">
              {t("enquiry.eventType")}
            </label>
            <select
              id="eventType"
              required
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                {t("enquiry.selectEventType")}
              </option>
              {EVENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.key)}
                </option>
              ))}
            </select>
          </div>
          {eventType === "Other" && (
            <Field label={t("enquiry.specify")} name="eventTypeOther" type="text" required />
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("enquiry.pax")} name="pax" type="number" required min={1} />
            <Field label={t("enquiry.eventDate")} name="eventDate" type="date" required min={todayISO()} />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="message">
          {t("enquiry.message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder={t("enquiry.messagePlaceholder")}
          className={inputClass}
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? t("enquiry.submitting") : t("enquiry.submit")}
      </button>
    </form>
  );
}

"use client";

import { COUNTRY_CODES, DEFAULT_DIAL_CODE } from "@/lib/countryCodes";
import { controlClass, labelClass } from "./FormField";

export default function PhoneField({ label, countryLabel }: { label: string; countryLabel: string }) {
  return (
    <div>
      <label className={labelClass} htmlFor="phone">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          name="dialCode"
          aria-label={countryLabel}
          defaultValue={DEFAULT_DIAL_CODE}
          className={`${controlClass} w-36 shrink-0`}
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.name} value={country.dial}>
              {country.name} {country.dial}
            </option>
          ))}
        </select>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          placeholder="50 123 4567"
          className={`${controlClass} min-w-0 flex-1`}
        />
      </div>
    </div>
  );
}

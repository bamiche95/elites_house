"use client";

import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";

import { Field, Input, Select } from "@/components/ui/form";
import { COUNTRIES, type AddressState } from "@/components/checkout/types";

export function AddressFields({
  value,
  onChange,
  errors = {},
  idPrefix = "shipping",
  showLabel = false,
}: {
  value: AddressState;
  onChange: (patch: Partial<AddressState>) => void;
  errors?: Record<string, string>;
  idPrefix?: string;
  showLabel?: boolean;
}) {
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const isUk = value.country === "GB";

  async function lookup() {
    if (!value.postcode.trim()) {
      setLookupError("Enter your postcode first.");
      return;
    }
    setLooking(true);
    setLookupError(null);
    try {
      const response = await fetch(
        `/api/postcode?q=${encodeURIComponent(value.postcode.trim())}`,
      );
      const data = (await response.json()) as {
        result?: { city?: string; county?: string; postcode?: string };
        error?: string;
      };
      if (!response.ok || !data.result) {
        setLookupError(data.error ?? "We couldn't find that postcode. Enter it manually.");
        return;
      }
      onChange({
        city: value.city || data.result.city || "",
        county: value.county || data.result.county || "",
        postcode: data.result.postcode ?? value.postcode,
      });
    } catch {
      setLookupError("Address lookup is unavailable — enter it manually.");
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="space-y-4">
      {showLabel ? (
        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-mocha">Billing address</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor={`${idPrefix}-fullName`} error={errors.fullName}>
          <Input
            id={`${idPrefix}-fullName`}
            value={value.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Phone" htmlFor={`${idPrefix}-phone`} error={errors.phone}>
          <Input
            id={`${idPrefix}-phone`}
            value={value.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            autoComplete="tel"
            inputMode="tel"
            required
          />
        </Field>
      </div>

      <Field label="Address line 1" htmlFor={`${idPrefix}-line1`} error={errors.line1}>
        <Input
          id={`${idPrefix}-line1`}
          value={value.line1}
          onChange={(event) => onChange({ line1: event.target.value })}
          autoComplete="address-line1"
          required
        />
      </Field>

      <Field label="Address line 2 (optional)" htmlFor={`${idPrefix}-line2`}>
        <Input
          id={`${idPrefix}-line2`}
          value={value.line2}
          onChange={(event) => onChange({ line2: event.target.value })}
          autoComplete="address-line2"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Town / city" htmlFor={`${idPrefix}-city`} error={errors.city}>
          <Input
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(event) => onChange({ city: event.target.value })}
            autoComplete="address-level2"
            required
          />
        </Field>
        <Field label="County / state (optional)" htmlFor={`${idPrefix}-county`}>
          <Input
            id={`${idPrefix}-county`}
            value={value.county}
            onChange={(event) => onChange({ county: event.target.value })}
            autoComplete="address-level1"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={isUk ? "Postcode" : "Postcode / ZIP"}
          htmlFor={`${idPrefix}-postcode`}
          error={errors.postcode}
        >
          <Input
            id={`${idPrefix}-postcode`}
            value={value.postcode}
            onChange={(event) => onChange({ postcode: event.target.value })}
            autoComplete="postal-code"
            required
          />
        </Field>
        <Field label="Country" htmlFor={`${idPrefix}-country`}>
          <Select
            id={`${idPrefix}-country`}
            value={value.country}
            onChange={(event) => onChange({ country: event.target.value })}
            autoComplete="country"
          >
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isUk ? (
        <div>
          <button
            type="button"
            onClick={lookup}
            disabled={looking}
            className="inline-flex items-center gap-2 border border-line px-3 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-espresso transition-colors hover:border-ink disabled:opacity-60"
          >
            {looking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
            {looking ? "Looking up…" : "Fill from postcode"}
          </button>
          {lookupError ? <p className="mt-1.5 text-xs text-danger">{lookupError}</p> : null}
          <p className="mt-1.5 text-[0.65rem] text-mocha">
            UK lookup fills your town and county. Add the street line yourself.
          </p>
        </div>
      ) : (
        <p className="text-[0.65rem] text-mocha">
          International orders are shipped with tracked services; duties are payable on
          delivery.
        </p>
      )}
    </div>
  );
}

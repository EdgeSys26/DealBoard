"use client";

import { useMemo, useRef, useState } from "react";
import { citiesIntersectingCircle } from "@/lib/area-cities";
import { digitsZip, listZipPins, resolveBuyBoxPin } from "@/lib/geo-pins";

const ZIP_OPTIONS = listZipPins();

export function WhereSection({
  centerLabel,
  zip,
  radiusMiles,
  lat,
  lng,
  excludedCities,
}: {
  centerLabel: string;
  zip: string;
  radiusMiles: number;
  lat: number;
  lng: number;
  excludedCities: string[];
}) {
  const excludedRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(centerLabel);
  const [zipValue, setZipValue] = useState(zip);
  const [radius, setRadius] = useState(String(radiusMiles));
  const [excluded, setExcluded] = useState<string[]>(excludedCities);

  const pin = useMemo(
    () =>
      resolveBuyBoxPin({
        zip: zipValue,
        centerLabel: label,
        fallback: { lat, lng, label: centerLabel, zip },
      }),
    [zipValue, label, lat, lng, centerLabel, zip],
  );
  const radiusValue = Number(radius);
  const chipCities = citiesIntersectingCircle(pin, Number.isFinite(radiusValue) ? radiusValue : 0);
  const zipDigits = digitsZip(zipValue);
  const unknownZip = zipDigits.length === 5 && !pin.matched;

  function writeExcluded(next: string[]) {
    if (excludedRef.current) {
      excludedRef.current.value = JSON.stringify(next);
      excludedRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setExcluded(next);
  }

  function applyZip(nextZip: string) {
    setZipValue(nextZip);
    const next = resolveBuyBoxPin({
      zip: nextZip,
      centerLabel: label,
      fallback: pin,
    });
    if (next.matched) {
      setLabel(next.label);
      writeExcluded(
        excluded.filter((city) =>
          citiesIntersectingCircle(next, Number.isFinite(radiusValue) ? radiusValue : 0).includes(city),
        ),
      );
    }
  }

  function applyLabel(nextLabel: string) {
    setLabel(nextLabel);
    const next = resolveBuyBoxPin({
      zip: zipValue,
      centerLabel: nextLabel,
      fallback: pin,
    });
    if (next.matched) {
      setZipValue(next.zip || zipValue);
      writeExcluded(
        excluded.filter((city) =>
          citiesIntersectingCircle(next, Number.isFinite(radiusValue) ? radiusValue : 0).includes(city),
        ),
      );
    }
  }

  function toggleCity(city: string, on: boolean) {
    writeExcluded(on ? excluded.filter((item) => item !== city) : excluded.includes(city) ? excluded : [...excluded, city]);
  }

  return (
    <section className="card buybox-section">
      <div className="buybox-section-head">
        <p className="font-semibold">1. Where</p>
      </div>
      <input
        ref={excludedRef}
        type="hidden"
        name="excludedCities"
        defaultValue={JSON.stringify(excludedCities)}
      />
      <label className="field">
        Pin or zip
        <input
          name="centerLabel"
          value={label}
          onChange={(event) => applyLabel(event.target.value)}
          list="buybox-pins"
        />
      </label>
      <label className="field">
        Zip
        <input
          name="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          value={zipValue}
          onChange={(event) => applyZip(event.target.value)}
          list="buybox-zips"
        />
      </label>
      <datalist id="buybox-zips">
        {ZIP_OPTIONS.map((option) => (
          <option key={`${option.zip}-${option.label}`} value={option.zip}>
            {option.label}
          </option>
        ))}
      </datalist>
      <datalist id="buybox-pins">
        {ZIP_OPTIONS.map((option) => (
          <option key={`pin-${option.zip}-${option.label}`} value={option.label}>
            {option.zip}
          </option>
        ))}
      </datalist>
      <label className="field">
        Radius (miles)
        <input
          name="radiusMiles"
          type="number"
          step="0.5"
          value={radius}
          onChange={(event) => {
            const value = event.target.value;
            setRadius(value);
            const nextRadius = Number(value);
            const nextCities = citiesIntersectingCircle(pin, Number.isFinite(nextRadius) ? nextRadius : 0);
            writeExcluded(excluded.filter((city) => nextCities.includes(city)));
          }}
        />
      </label>
      <p className="text-sm font-medium">Cities in this circle</p>
      {chipCities.length ? (
        <div className="city-chips">
          {chipCities.map((city) => {
            const on = !excluded.includes(city);
            return (
              <button
                key={city}
                type="button"
                className="chip"
                data-on={on ? "true" : "false"}
                aria-pressed={on}
                onClick={() => toggleCity(city, !on)}
              >
                {city}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted">
          No catalog cities in this circle. Widen the radius or pick another zip.
        </p>
      )}
      <p className="text-xs text-muted">
        {unknownZip
          ? `Zip ${zipDigits} is not on the board map yet. Cities still follow ${pin.label}.`
          : `Cities follow ${pin.label}${pin.zip ? ` · ${pin.zip}` : ""}.`}{" "}
        Default all on. Deselect a city to hide it from Home and this box. Alerts stay A/B only
        inside selected cities.
      </p>
    </section>
  );
}

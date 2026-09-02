"use client";

import { useMemo, useState } from "react";
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

  function applyZip(nextZip: string) {
    setZipValue(nextZip);
    const next = resolveBuyBoxPin({
      zip: nextZip,
      centerLabel: label,
      fallback: pin,
    });
    if (next.matched) {
      setLabel(next.label);
      setExcluded((current) =>
        current.filter((city) =>
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
      setExcluded((current) =>
        current.filter((city) =>
          citiesIntersectingCircle(next, Number.isFinite(radiusValue) ? radiusValue : 0).includes(city),
        ),
      );
    }
  }

  function toggleCity(city: string, on: boolean) {
    setExcluded((current) => {
      if (on) return current.filter((item) => item !== city);
      return current.includes(city) ? current : [...current, city];
    });
  }

  return (
    <section className="card buybox-section">
      <div className="buybox-section-head">
        <p className="font-semibold">1. Where</p>
      </div>
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
          onChange={(event) => setRadius(event.target.value)}
        />
      </label>
      <p className="text-sm font-medium">Cities in this circle</p>
      {chipCities.length ? (
        <div className="city-chips">
          {chipCities.map((city) => {
            const on = !excluded.includes(city);
            return (
              <label key={city} className="chip" data-on={on ? "true" : "false"}>
                <input
                  type="checkbox"
                  name="cities"
                  value={city}
                  checked={on}
                  onChange={(event) => toggleCity(city, event.target.checked)}
                  className="w-auto"
                />
                {city}
              </label>
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

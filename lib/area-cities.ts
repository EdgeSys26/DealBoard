import { haversineMiles } from "./geo";

export const AREA_CITIES = [
  { name: "Noblesville", lat: 40.0456, lng: -86.0086, spread: 3 },
  { name: "Carmel", lat: 39.9784, lng: -86.118, spread: 3 },
  { name: "Zionsville", lat: 39.9509, lng: -86.2619, spread: 2.5 },
  { name: "Westfield", lat: 40.0431, lng: -86.1275, spread: 2.5 },
  { name: "Indianapolis", lat: 39.7684, lng: -86.1581, spread: 8 },
  { name: "Fishers", lat: 39.9568, lng: -86.0139, spread: 3 },
  { name: "Cicero", lat: 40.1239, lng: -86.0144, spread: 2 },
  { name: "Whitestown", lat: 39.9973, lng: -86.3455, spread: 2 },
  { name: "Sheridan", lat: 40.135, lng: -86.2205, spread: 2 },
  { name: "Fillmore", lat: 39.7356, lng: -86.7536, spread: 2 },
] as const;

export function citiesIntersectingCircle(
  pin: { lat: number; lng: number },
  radiusMiles: number,
) {
  return AREA_CITIES.filter(
    (city) => haversineMiles(pin, city) <= radiusMiles + city.spread + 0.05,
  ).map((city) => city.name);
}

export function parseExcludedCities(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

export function cityAllowed(city: string, excluded: string[]) {
  return !excluded.includes(city);
}

export function mergeExcludedCities(
  previous: string[],
  chipCities: string[],
  selected: string[],
) {
  const next = new Set(previous.filter((city) => !chipCities.includes(city)));
  for (const city of chipCities) {
    if (!selected.includes(city)) next.add(city);
  }
  return [...next];
}

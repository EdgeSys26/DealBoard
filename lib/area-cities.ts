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
  { name: "Arcadia", lat: 40.1742, lng: -86.0214, spread: 1.5 },
  { name: "McCordsville", lat: 39.9064, lng: -85.9208, spread: 2 },
  { name: "Fortville", lat: 39.9323, lng: -85.8472, spread: 2 },
  { name: "Fillmore", lat: 39.7356, lng: -86.7536, spread: 2 },
  { name: "Avon", lat: 39.763, lng: -86.4, spread: 2.5 },
  { name: "Brownsburg", lat: 39.843, lng: -86.398, spread: 2.5 },
  { name: "Lebanon", lat: 40.048, lng: -86.469, spread: 2.5 },
  { name: "Greenfield", lat: 39.785, lng: -85.769, spread: 2.5 },
  { name: "Pendleton", lat: 40.003, lng: -85.746, spread: 2 },
  { name: "Plainfield", lat: 39.704, lng: -86.399, spread: 2.5 },
  { name: "Greenwood", lat: 39.614, lng: -86.107, spread: 3 },
  { name: "Anderson", lat: 40.105, lng: -85.68, spread: 3 },
  { name: "Tipton", lat: 40.282, lng: -86.041, spread: 2 },
  { name: "Lapel", lat: 40.068, lng: -85.848, spread: 1.5 },
] as const;

export function citiesIntersectingCircle(
  pin: { lat: number; lng: number },
  radiusMiles: number,
): string[] {
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

export const HOME_OFF_COOKIE = "dealboard-home-off";

/** Cities still shown on Home. Buy Box exclusions drop off this row. Home-off chips stay. */
export function homeCityChips(cities: string[], buyBoxExcluded: string[]) {
  return cities.filter((city) => cityAllowed(city, buyBoxExcluded));
}

export function pruneHomeOffCities(
  homeOff: string[],
  chipCities: string[],
  buyBoxExcluded: string[],
) {
  return homeOff.filter((city) => chipCities.includes(city) && cityAllowed(city, buyBoxExcluded));
}

export function mergeExcludedCities(
  _previous: string[],
  chipCities: string[],
  selected: string[],
) {
  return chipCities.filter((city) => !selected.includes(city));
}

export function exclusionsFromBuyBoxForm(
  chipCities: string[],
  previous: string[],
  selected: string[],
  excludedRaw: FormDataEntryValue | null,
) {
  if (typeof excludedRaw === "string") {
    const explicit = new Set(parseExcludedCities(excludedRaw));
    return chipCities.filter((city) => explicit.has(city));
  }
  return mergeExcludedCities(previous, chipCities, selected);
}

import { AREA_CITIES } from "./area-cities";
import { NOBLESVILLE_SQUARE } from "./types";

export type GeoPin = {
  label: string;
  zip: string;
  lat: number;
  lng: number;
  matched: boolean;
};

type PinSeed = { zip: string; label: string; lat: number; lng: number };

function cityPin(name: (typeof AREA_CITIES)[number]["name"], zip: string, label = name): PinSeed {
  const city = AREA_CITIES.find((item) => item.name === name);
  if (!city) throw new Error(`Unknown area city ${name}`);
  return { zip, label, lat: city.lat, lng: city.lng };
}

const PIN_SEEDS: PinSeed[] = [
  { zip: "46060", label: "Noblesville square", lat: NOBLESVILLE_SQUARE.lat, lng: NOBLESVILLE_SQUARE.lng },
  { zip: "46062", label: "Noblesville", lat: 40.0701, lng: -86.0588 },
  cityPin("Carmel", "46032"),
  { zip: "46033", label: "Carmel", lat: 39.9784, lng: -86.086 },
  cityPin("Fishers", "46038"),
  { zip: "46037", label: "Fishers", lat: 39.9568, lng: -85.968 },
  cityPin("Westfield", "46074"),
  cityPin("Zionsville", "46077"),
  cityPin("Whitestown", "46075"),
  cityPin("Cicero", "46034"),
  cityPin("Arcadia", "46030"),
  cityPin("McCordsville", "46055"),
  cityPin("Fortville", "46040"),
  cityPin("Sheridan", "46069"),
  cityPin("Fillmore", "46128"),
  { zip: "46250", label: "Indianapolis", lat: 39.9124, lng: -86.0648 },
  { zip: "46240", label: "Indianapolis", lat: 39.913, lng: -86.139 },
  { zip: "46220", label: "Indianapolis", lat: 39.869, lng: -86.142 },
  { zip: "46256", label: "Indianapolis", lat: 39.912, lng: -86.008 },
  { zip: "46260", label: "Indianapolis", lat: 39.912, lng: -86.188 },
  { zip: "46268", label: "Indianapolis", lat: 39.898, lng: -86.228 },
  { zip: "46280", label: "Indianapolis", lat: 39.938, lng: -86.118 },
  { zip: "46236", label: "Indianapolis", lat: 39.89, lng: -85.968 },
  { zip: "46226", label: "Indianapolis", lat: 39.828, lng: -86.07 },
  { zip: "46205", label: "Indianapolis", lat: 39.832, lng: -86.142 },
  { zip: "46208", label: "Indianapolis", lat: 39.826, lng: -86.176 },
  { zip: "46204", label: "Indianapolis", lat: 39.771, lng: -86.158 },
  { zip: "46202", label: "Indianapolis", lat: 39.783, lng: -86.151 },
  { zip: "46201", label: "Indianapolis", lat: 39.773, lng: -86.126 },
  { zip: "46203", label: "Indianapolis", lat: 39.748, lng: -86.126 },
  { zip: "46219", label: "Indianapolis", lat: 39.793, lng: -86.066 },
  { zip: "46227", label: "Indianapolis", lat: 39.673, lng: -86.126 },
  { zip: "46217", label: "Indianapolis", lat: 39.677, lng: -86.188 },
  { zip: "46254", label: "Indianapolis", lat: 39.852, lng: -86.268 },
  { zip: "46214", label: "Indianapolis", lat: 39.795, lng: -86.286 },
  { zip: "46234", label: "Indianapolis", lat: 39.818, lng: -86.298 },
  { zip: "46241", label: "Indianapolis", lat: 39.728, lng: -86.278 },
  { zip: "46140", label: "Greenfield", lat: 39.785, lng: -85.769 },
  { zip: "46123", label: "Avon", lat: 39.763, lng: -86.4 },
  { zip: "46112", label: "Brownsburg", lat: 39.843, lng: -86.398 },
  { zip: "46052", label: "Lebanon", lat: 40.048, lng: -86.469 },
  { zip: "46064", label: "Pendleton", lat: 40.003, lng: -85.746 },
  { zip: "46168", label: "Plainfield", lat: 39.704, lng: -86.399 },
  { zip: "46142", label: "Greenwood", lat: 39.614, lng: -86.107 },
  { zip: "46143", label: "Greenwood", lat: 39.591, lng: -86.158 },
  { zip: "46016", label: "Anderson", lat: 40.105, lng: -85.68 },
  { zip: "46072", label: "Tipton", lat: 40.282, lng: -86.041 },
  { zip: "46051", label: "Lapel", lat: 40.068, lng: -85.848 },
];

const ZIP_PINS = new Map(PIN_SEEDS.map((pin) => [pin.zip, pin]));

const LABEL_PINS = new Map<string, PinSeed>();
for (const pin of PIN_SEEDS) {
  const key = normalizePinLabel(pin.label);
  if (!LABEL_PINS.has(key)) LABEL_PINS.set(key, pin);
}
LABEL_PINS.set("noblesville square", ZIP_PINS.get("46060")!);
LABEL_PINS.set("noblesville", ZIP_PINS.get("46060")!);
for (const city of AREA_CITIES) {
  const key = normalizePinLabel(city.name);
  if (!LABEL_PINS.has(key)) {
    const byName = PIN_SEEDS.find((pin) => normalizePinLabel(pin.label) === key);
    LABEL_PINS.set(key, byName ?? { zip: "", label: city.name, lat: city.lat, lng: city.lng });
  }
}

export function normalizePinLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function digitsZip(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

export function listZipPins() {
  return [...PIN_SEEDS].sort((a, b) => a.zip.localeCompare(b.zip) || a.label.localeCompare(b.label));
}

export function resolveBuyBoxPin(input: {
  zip?: string | null;
  centerLabel?: string | null;
  fallback?: { lat: number; lng: number; label?: string | null; zip?: string | null } | null;
}): GeoPin {
  const zip = digitsZip(input.zip);
  const labeledZip = digitsZip(input.centerLabel);
  const fallback = input.fallback;

  const fromZip = zip.length === 5 ? ZIP_PINS.get(zip) : undefined;
  if (fromZip) {
    return { ...fromZip, matched: true };
  }

  const fromLabelZip = labeledZip.length === 5 ? ZIP_PINS.get(labeledZip) : undefined;
  if (fromLabelZip) {
    return { ...fromLabelZip, matched: true };
  }

  const fromLabel = LABEL_PINS.get(normalizePinLabel(input.centerLabel || ""));
  if (fromLabel) {
    return { ...fromLabel, matched: true };
  }

  if (fallback) {
    return {
      label: fallback.label || input.centerLabel || NOBLESVILLE_SQUARE.label,
      zip: digitsZip(fallback.zip) || zip || NOBLESVILLE_SQUARE.zip,
      lat: fallback.lat,
      lng: fallback.lng,
      matched: false,
    };
  }

  return { ...NOBLESVILLE_SQUARE, matched: zip.length !== 5 };
}

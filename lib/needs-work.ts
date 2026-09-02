export const NEEDS_WORK = [
  "Roof",
  "Foundation",
  "HVAC",
  "Electrical",
  "Plumbing",
  "Windows",
  "Kitchen",
  "Baths",
  "Flooring",
  "Sewer / septic",
  "Mold / moisture",
  "Other",
] as const;

export type NeedsWork = (typeof NEEDS_WORK)[number];

export function parseNeedsWork(raw: unknown): NeedsWork[] {
  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(raw) as unknown;
            return Array.isArray(parsed) ? parsed : raw.split(",");
          } catch {
            return raw.split(",");
          }
        })()
      : [];
  const allowed = new Set<string>(NEEDS_WORK);
  const next: NeedsWork[] = [];
  for (const item of values) {
    const value = String(item || "").trim();
    if (allowed.has(value) && !next.includes(value as NeedsWork)) {
      next.push(value as NeedsWork);
    }
  }
  return next;
}

export function needsWorkJson(raw: unknown): string {
  return JSON.stringify(parseNeedsWork(raw));
}

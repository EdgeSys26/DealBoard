export const OCCUPANCIES = ["Owner occupied", "Tenant", "Vacant"] as const;
export type Occupancy = (typeof OCCUPANCIES)[number];

export const TRESPASS_NOTICE =
  "Listing information is not permission to visit, enter, or contact occupants. Do not trespass.";

export function parseOccupancy(raw: unknown): Occupancy {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "tenant" || value.startsWith("tenant")) return "Tenant";
  if (value === "owner occupied" || value === "occupied" || value.startsWith("owner")) {
    return "Owner occupied";
  }
  if (value === "vacant") return "Vacant";
  return "Vacant";
}

export function occupancyChip(raw: unknown): "Occupied" | "Tenant" | "Vacant" {
  const occupancy = parseOccupancy(raw);
  if (occupancy === "Owner occupied") return "Occupied";
  return occupancy;
}

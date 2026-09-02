export const ROLES = ["BUYER", "SELLER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const BADGES = ["GREEN", "SILVER", "GOLD"] as const;
export type Badge = (typeof BADGES)[number];

export const WORK_LEVELS = [
  "TURNKEY",
  "PAINT_CARPET",
  "LIGHT_COSMETIC",
  "MEDIUM",
  "HEAVY",
  "FULL_GUT",
  "FIRE_INSURANCE",
  "LAND_TEARDOWN",
] as const;
export type WorkLevel = (typeof WORK_LEVELS)[number];

export const LISTING_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "ON_HOLD",
  "UNDER_CONTRACT",
  "ASSIGNED",
  "EXPIRED",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const ALERT_MODES = ["A_AND_B", "A_ONLY", "APP_ONLY"] as const;
export type AlertMode = (typeof ALERT_MODES)[number];

export type Letter = "A+" | "A" | "B" | "C" | "D" | "NO_FIT";

export type GradeBars = {
  discount: number;
  rehab: number;
  layout: number;
  trust: number;
  time: number;
};

export type GradeResult = {
  letter: Letter;
  score: number;
  isFit: boolean;
  bars: GradeBars;
  gateFails: string[];
  hasAvm: boolean;
};

export type BuyBoxInput = {
  lat: number;
  lng: number;
  radiusMiles: number;
  maxAssignmentPrice: number;
  minBeds?: number | null;
  minSf?: number | null;
  workLevels: WorkLevel[];
  willingToFix: string[];
  maxRehab?: number | null;
};

export type ListingGradeInput = {
  lat: number;
  lng: number;
  assignmentPrice: number;
  platformAvm: number | null;
  beds: number;
  baths: number;
  sf: number;
  workLevel: WorkLevel;
  needs: string[];
  rehabEstimate: number;
  verified: boolean;
  sellerBadge: Badge;
  hasWalkthrough: boolean;
  photoCount: number;
  daysRemaining: number;
};

export const WORK_LEVEL_LABEL: Record<WorkLevel, string> = {
  TURNKEY: "Turnkey",
  PAINT_CARPET: "Paint & carpet",
  LIGHT_COSMETIC: "Light cosmetic",
  MEDIUM: "Medium",
  HEAVY: "Heavy",
  FULL_GUT: "Full gut",
  FIRE_INSURANCE: "Fire / insurance",
  LAND_TEARDOWN: "Land / teardown",
};

export function parseWorkLevel(raw: unknown): WorkLevel {
  const value = String(raw || "");
  return (WORK_LEVELS as readonly string[]).includes(value) ? (value as WorkLevel) : "MEDIUM";
}

export function parseWorkLevels(raw: unknown[]): WorkLevel[] {
  const allowed = new Set<string>(WORK_LEVELS);
  const next: WorkLevel[] = [];
  for (const item of raw) {
    const value = String(item || "");
    if (allowed.has(value) && !next.includes(value as WorkLevel)) next.push(value as WorkLevel);
  }
  return next;
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  UNDER_CONTRACT: "Pending",
  ASSIGNED: "Assigned",
  EXPIRED: "Expired",
};

export const BADGE_LABEL: Record<Badge, string> = {
  GREEN: "Green",
  SILVER: "Silver",
  GOLD: "Gold",
};

export const NOBLESVILLE_SQUARE = {
  label: "Noblesville square",
  zip: "46060",
  lat: 40.0456,
  lng: -86.0086,
};

export const HOLD_MS = 2 * 60 * 60 * 1000;
export const MAX_ON_HOLD_DAYS = 7;
export const MAX_LIVE_DAYS = 14;
export const DEFAULT_OFFER_FLOOR_PCT = 10;
export const DEFAULT_TITLE_DEPOSIT = 2500;
export const BILLING_BASE = 249;
export const BILLING_EXTRA = 49;
export const INCLUDED_ACTIVE_SLOTS = 1;

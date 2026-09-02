import type { Badge } from "./types";

export const HOT_COOLDOWN_DAYS = 7;

export const HOT_PLANS = {
  48: { hours: 48, dollars: 99, label: "48h" },
  72: { hours: 72, dollars: 179, label: "72h" },
} as const;

export type HotHours = keyof typeof HOT_PLANS;

export function hotPlan(hours: number) {
  if (hours === 48 || hours === 72) return HOT_PLANS[hours];
  return null;
}

export function isListingHot(
  listing: { hotUntil?: Date | null },
  now = new Date(),
) {
  return Boolean(listing.hotUntil && listing.hotUntil.getTime() > now.getTime());
}

export function canHotBadge(badge: string): badge is Badge {
  return badge === "SILVER" || badge === "GOLD";
}

export function lastHotEndedAt(
  listings: { hotUntil?: Date | null }[],
) {
  const ends = listings
    .map((listing) => listing.hotUntil)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime());
  return ends[0] ?? null;
}

export function hotCooldownUntil(lastEnd: Date | null) {
  if (!lastEnd) return null;
  return new Date(lastEnd.getTime() + HOT_COOLDOWN_DAYS * 86_400_000);
}

export function evaluateHot(input: {
  badge: string;
  strikeCount: number;
  verified: boolean;
  status: string;
  hasTitle: boolean;
  listingHot: boolean;
  sellerHasLiveHot: boolean;
  cooldownUntil: Date | null;
  now?: Date;
}): { ok: boolean; reason: string } {
  const now = input.now ?? new Date();
  if (!canHotBadge(input.badge)) {
    return { ok: false, reason: "Green cannot Hot" };
  }
  if (input.strikeCount > 0) {
    return { ok: false, reason: "Open strike" };
  }
  if (!input.verified) {
    return { ok: false, reason: "Contract not verified" };
  }
  if (input.status !== "ACTIVE") {
    return { ok: false, reason: "Listing must be Active" };
  }
  if (!input.hasTitle) {
    return { ok: false, reason: "Title on file required" };
  }
  if (input.listingHot) {
    return { ok: false, reason: "Already Hot" };
  }
  if (input.sellerHasLiveHot) {
    return { ok: false, reason: "One Hot per seller" };
  }
  if (input.cooldownUntil && now < input.cooldownUntil) {
    return { ok: false, reason: "7-day cooldown" };
  }
  return { ok: true, reason: "" };
}

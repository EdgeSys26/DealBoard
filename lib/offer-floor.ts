import { DEFAULT_OFFER_FLOOR_PCT } from "./types";

export function minOfferPrice(
  assignmentPrice: number,
  floorPct: number = DEFAULT_OFFER_FLOOR_PCT,
): number {
  const pct = Math.min(DEFAULT_OFFER_FLOOR_PCT, Math.max(0, floorPct));
  return Math.ceil(assignmentPrice * (1 - pct / 100));
}

export function assertOfferFloor(
  offerPrice: number,
  assignmentPrice: number,
  floorPct: number = DEFAULT_OFFER_FLOOR_PCT,
): { ok: true } | { ok: false; min: number; message: string } {
  const min = minOfferPrice(assignmentPrice, floorPct);
  if (offerPrice < min) {
    return {
      ok: false,
      min,
      message: `Offer cannot be more than ${floorPct}% below asking. Floor is $${min.toLocaleString()}.`,
    };
  }
  return { ok: true };
}

export function tightenFloorPct(current: number, next: number): number {
  if (next > DEFAULT_OFFER_FLOOR_PCT) return DEFAULT_OFFER_FLOOR_PCT;
  if (next < 0) return 0;
  return Math.min(current, next);
}

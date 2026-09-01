import { DEFAULT_TITLE_DEPOSIT } from "./types";

export function clampListingDeposit(requested: number, platformDefault: number) {
  const floor = Number.isFinite(platformDefault) && platformDefault > 0 ? platformDefault : DEFAULT_TITLE_DEPOSIT;
  const n = Math.round(requested);
  if (!Number.isFinite(n) || n < floor) return floor;
  return n;
}

export function listingTitleDeposit(
  listing: { titleDeposit?: number | null },
  platformDefault: number,
) {
  return Math.max(listing.titleDeposit ?? platformDefault, platformDefault);
}

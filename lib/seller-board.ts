import { daysBetween } from "./geo";

export const EXPIRY_WARN_DAYS = 3;

export function listingDaysLeft(expiresAt: Date, now = new Date()) {
  return Math.max(0, daysBetween(now, expiresAt));
}

export function listingDaysCopy(
  expiresAt: Date,
  status: string,
  now = new Date(),
) {
  const raw = daysBetween(now, expiresAt);
  if (status === "EXPIRED" || raw < 0) return "Expired";
  if (raw === 0) return "0 days left";
  if (raw === 1) return "1 day left";
  return `${raw} days left`;
}

export function listingExpiresSoon(
  listing: { status: string; contractExpiresAt: Date },
  now = new Date(),
) {
  if (listing.status === "EXPIRED" || listing.status === "ASSIGNED" || listing.status === "DRAFT") {
    return false;
  }
  const days = listingDaysLeft(listing.contractExpiresAt, now);
  return days >= 0 && days <= EXPIRY_WARN_DAYS;
}

export function isUnseenSellerOffer(
  offer: {
    status: string;
    createdAt: Date;
    updatedAt?: Date | null;
    counterPrice?: number | null;
  },
  seenAt: Date | null,
) {
  const seen = seenAt ?? new Date(0);
  if (offer.status === "PENDING" && offer.createdAt > seen) return true;
  if (
    (offer.status === "ACCEPTED" || offer.status === "DECLINED") &&
    offer.counterPrice != null
  ) {
    const when = offer.updatedAt ?? offer.createdAt;
    return when > seen;
  }
  return false;
}

export function sellerBoardStats(
  listings: {
    status: string;
    contractExpiresAt: Date;
    offers: { status: string }[];
  }[],
) {
  const forSale = listings.filter((l) => l.status === "ACTIVE").length;
  const parked = listings.filter((l) => l.status === "ON_HOLD" || l.status === "UNDER_CONTRACT").length;
  const openOffers = listings.reduce(
    (n, l) => n + l.offers.filter((o) => o.status === "PENDING" || o.status === "COUNTERED").length,
    0,
  );
  const sold = listings.filter((l) => l.status === "ASSIGNED").length;
  const live = listings.filter(
    (l) => l.status === "ACTIVE" || l.status === "ON_HOLD" || l.status === "UNDER_CONTRACT",
  );
  const next = live
    .map((l) => l.contractExpiresAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  return { forSale, parked, openOffers, sold, nextExpiry: next ?? null };
}

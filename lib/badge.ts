import { prisma } from "./prisma";
import { BADGES, type Badge } from "./types";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function computeBadge(input: {
  fundedCloses: number;
  fundedLast12Months: number;
  openStrikes: number;
}): Badge {
  if (input.fundedLast12Months >= 5 && input.openStrikes === 0) return "GOLD";
  if (input.fundedCloses >= 1) return "SILVER";
  return "GREEN";
}

export function yearAgo(now = new Date()) {
  return new Date(now.getTime() - YEAR_MS);
}

export async function recalcUserBadge(userId: string, now = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      listings: { select: { status: true, createdAt: true } },
      strikes: { select: { id: true } },
    },
  });
  if (!user) return null;
  const assigned = user.listings.filter((listing) => listing.status === "ASSIGNED");
  const cutoff = yearAgo(now);
  const fundedCloses = assigned.length;
  const fundedLast12Months = assigned.filter((listing) => listing.createdAt >= cutoff).length;
  const badge = computeBadge({
    fundedCloses,
    fundedLast12Months,
    openStrikes: user.strikes.length,
  });
  const next = user.badgeOverride
    ? { fundedCloses }
    : { fundedCloses, badge };
  await prisma.user.update({ where: { id: userId }, data: next });
  return { fundedCloses, fundedLast12Months, badge: user.badgeOverride ? user.badge : badge };
}

export async function recalcOnFundedClose(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { offers: { where: { status: "ACCEPTED" }, select: { buyerId: true } } },
  });
  if (!listing) return;
  await recalcUserBadge(listing.sellerId);
  const buyerId = listing.offers[0]?.buyerId;
  if (buyerId) await recalcUserBadge(buyerId);
}

export function parseBadgeOverride(raw: string): Badge | "AUTO" | null {
  const value = raw.trim().toUpperCase();
  if (value === "AUTO") return "AUTO";
  if ((BADGES as readonly string[]).includes(value)) return value as Badge;
  return null;
}

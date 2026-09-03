import { prisma } from "./prisma";
import { applyLifecycle } from "./lifecycle";
import { gradeAndCache } from "./grade-listing";
import { leftover } from "./grade";
import { minOfferPrice } from "./offer-floor";
import { listingTitleDeposit } from "./deposit";
import { listingPhotos } from "./listing-photos";
import { getBoardLevers, getPlatformTitleDeposit, type BoardLevers } from "./settings";
import { isUnseenSellerOffer, listingExpiresSoon, sellerBoardStats } from "./seller-board";
import { BILLING_BASE, type Letter } from "./types";
import type { SessionUser } from "./auth";
import { getBuyBox, getHomeFeed, type FeedView } from "./queries";

export async function getBuyerBoard(user: SessionUser, view: FeedView = "ab") {
  const feed = await getHomeFeed(user, view);
  const holds = await prisma.hold.findMany({
    where: { buyerId: user.id, released: false, expiresAt: { gt: new Date() } },
    include: { listing: true },
    orderBy: { expiresAt: "asc" },
  });
  const offers = await prisma.offer.findMany({
    where: { buyerId: user.id },
    include: { listing: { include: { titleFile: { include: { slots: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const saved = await prisma.favorite.findMany({
    where: { userId: user.id, kind: "FAVORITE" },
    include: { listing: { include: { seller: true } } },
    orderBy: { listingId: "asc" },
  });
  const hidden = await prisma.favorite.findMany({
    where: { userId: user.id, kind: "HIDDEN" },
    include: { listing: true },
    orderBy: { listingId: "asc" },
  });
  const savedSellers: { sellerId: string; name: string; listingId: string }[] = [];
  const seenSellers = new Set<string>();
  for (const row of saved) {
    if (seenSellers.has(row.listing.sellerId)) continue;
    seenSellers.add(row.listing.sellerId);
    savedSellers.push({
      sellerId: row.listing.sellerId,
      name: row.listing.seller.name,
      listingId: row.listingId,
    });
  }
  return { ...feed, holds, offers, saved, savedSellers, hidden };
}

export async function getListingDetail(id: string, user: SessionUser) {
  await applyLifecycle();
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: true,
      comps: true,
      titleFile: { include: { slots: true } },
      titleSlots: true,
      holds: { where: { released: false, expiresAt: { gt: new Date() } } },
      offers: { orderBy: { createdAt: "desc" } },
      favorites: { where: { userId: user.id } },
    },
  });
  if (!listing) return null;
  if (user.role === "BUYER" && listing.status === "ACTIVE") {
    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }
  const acceptedMine = listing.offers.find(
    (o) => o.status === "ACCEPTED" && o.buyerId === user.id,
  );
  const hiddenFromBuyer =
    user.role === "BUYER" &&
    (listing.status !== "ACTIVE" || !listing.verified) &&
    !acceptedMine;
  if (hiddenFromBuyer) {
    return { hidden: true as const, listing: null };
  }

  const box = await getBuyBox(user.id);
  const grade = box ? await gradeAndCache(listing.id, box.id) : null;
  const myHold = listing.holds.find((h) => h.buyerId === user.id);
  const myOffer = listing.offers.find((o) => o.buyerId === user.id);
  const accepted = listing.offers.find((o) => o.status === "ACCEPTED");
  const floor = minOfferPrice(listing.assignmentPrice, listing.offerFloorPct);
  const titleDeposit = listingTitleDeposit(listing, await getPlatformTitleDeposit());
  const leftoverNow = leftover(
    listing.platformAvm,
    myOffer?.price ?? listing.assignmentPrice,
    listing.rehabEstimate,
  );

  return {
    hidden: false as const,
    listing,
    grade,
    myHold,
    myOffer,
    accepted,
    floor,
    leftoverNow,
    titleDeposit,
    photos: listingPhotos(listing),
    isHidden: listing.favorites.some((f) => f.kind === "HIDDEN"),
    isSaved: listing.favorites.some((f) => f.kind === "FAVORITE"),
    showSellerPhone: Boolean(accepted && accepted.buyerId === user.id),
    showWire: Boolean(listing.titleFile?.wireReleased && accepted),
  };
}

export function slotMeter(activeCount: number, levers: BoardLevers) {
  const extra = Math.max(0, activeCount - levers.includedActiveSlots);
  return {
    activeCount,
    included: levers.includedActiveSlots,
    extra,
    monthly: BILLING_BASE + extra * levers.extraListingDollars,
    base: BILLING_BASE,
    extraEach: levers.extraListingDollars,
  };
}

export function thisMonthStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

import { prisma } from "./prisma";
import { applyLifecycle } from "./lifecycle";
import { gradeAndCache } from "./grade-listing";
import { isHomeVisible, isInArea, leftover } from "./grade";
import { minOfferPrice } from "./offer-floor";
import { listingTitleDeposit } from "./deposit";
import { listingPhotos } from "./listing-photos";
import { getBoardLevers, getPlatformTitleDeposit, type BoardLevers } from "./settings";
import { isUnseenSellerOffer, listingExpiresSoon, sellerBoardStats } from "./seller-board";
import { isListingHot } from "./hot";
import { cookies } from "next/headers";
import { citiesIntersectingCircle, cityAllowed, HOME_OFF_COOKIE, parseExcludedCities } from "./area-cities";
import { BILLING_BASE, type Letter } from "./types";
import type { SessionUser } from "./auth";
import type { GradeResult } from "./types";

export async function getBuyBox(userId: string) {
  return prisma.buyBox.findFirst({ where: { userId } });
}

export type FeedView = "ab" | "all";

export function parseFeedView(raw: string | undefined): FeedView {
  return raw === "all" ? "all" : "ab";
}

export async function getHomeFeed(user: SessionUser, view: FeedView = "ab") {
  await applyLifecycle();
  const box = await getBuyBox(user.id);
  const listings = await prisma.listing.findMany({
    include: { seller: true, holds: { where: { released: false } }, favorites: true },
    orderBy: { createdAt: "desc" },
  });
  const muted = await prisma.mute.findMany({ where: { userId: user.id } });
  const mutedIds = new Set(muted.map((m) => m.mutedUserId));
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id, kind: "FAVORITE" },
    include: { listing: { select: { sellerId: true } } },
  });
  const hidden = await prisma.favorite.findMany({
    where: { userId: user.id, kind: "HIDDEN" },
    select: { listingId: true },
  });
  const hiddenIds = new Set(hidden.map((h) => h.listingId));
  const myOffers = await prisma.offer.findMany({ where: { buyerId: user.id } });
  const offerByListing = new Map(myOffers.map((o) => [o.listingId, o]));
  const favoriteSellerIds = new Set(favs.map((f) => f.listing.sellerId));
  const excludedCities = parseExcludedCities(box?.excludedCities);
  const homeOffCities = parseExcludedCities((await cookies()).get(HOME_OFF_COOKIE)?.value);
  const cityChips = box
    ? citiesIntersectingCircle({ lat: box.lat, lng: box.lng }, box.radiusMiles)
    : [];
  const feedExcluded = [...excludedCities, ...homeOffCities];

  const cards = [];
  for (const listing of listings) {
    if (listing.status !== "ACTIVE" || !listing.verified) continue;
    if (mutedIds.has(listing.sellerId)) continue;
    if (hiddenIds.has(listing.id)) continue;
    if (!cityAllowed(listing.city, feedExcluded)) continue;
    if (view === "all" && box && !isInArea(listing, box)) continue;
    let grade: GradeResult | null = null;
    if (box) {
      grade = await gradeAndCache(listing.id, box.id);
    }
    if (view !== "all" && grade && !isHomeVisible(grade.letter)) continue;
    cards.push({
      listing,
      grade,
      offer: offerByListing.get(listing.id) ?? null,
      saved: listing.favorites.some((f) => f.userId === user.id && f.kind === "FAVORITE"),
    });
  }

  cards.sort((a, b) => {
    const aHot = isListingHot(a.listing) ? 1 : 0;
    const bHot = isListingHot(b.listing) ? 1 : 0;
    if (aHot !== bHot) return bHot - aHot;
    const aFav = favoriteSellerIds.has(a.listing.sellerId) ? 1 : 0;
    const bFav = favoriteSellerIds.has(b.listing.sellerId) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return (b.grade?.score ?? 0) - (a.grade?.score ?? 0);
  });
  return {
    box,
    cards,
    looking: user.lookingStatus === "LOOKING",
    cityChips,
    excludedCities,
    homeOffCities,
  };
}

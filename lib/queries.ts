import { prisma } from "./prisma";
import { applyLifecycle } from "./lifecycle";
import { gradeAndCache } from "./grade-listing";
import { isHomeVisible, leftover } from "./grade";
import { minOfferPrice } from "./offer-floor";
import { listingTitleDeposit } from "./deposit";
import { listingPhotos } from "./listing-photos";
import { getBoardLevers, getPlatformTitleDeposit, type BoardLevers } from "./settings";
import { BILLING_BASE, type Letter } from "./types";
import type { SessionUser } from "./auth";
import type { GradeResult } from "./types";

export async function getBuyBox(userId: string) {
  return prisma.buyBox.findFirst({ where: { userId } });
}

export async function getHomeFeed(user: SessionUser) {
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
  const favoriteSellerIds = new Set(favs.map((f) => f.listing.sellerId));

  const cards = [];
  for (const listing of listings) {
    if (listing.status !== "ACTIVE") continue;
    if (mutedIds.has(listing.sellerId)) continue;
    let grade: GradeResult | null = null;
    if (box) {
      grade = await gradeAndCache(listing.id, box.id);
    }
    if (grade && !isHomeVisible(grade.letter)) continue;
    cards.push({ listing, grade });
  }

  cards.sort((a, b) => {
    const aFav = favoriteSellerIds.has(a.listing.sellerId) ? 1 : 0;
    const bFav = favoriteSellerIds.has(b.listing.sellerId) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return (b.grade?.score ?? 0) - (a.grade?.score ?? 0);
  });
  return { box, cards, looking: user.lookingStatus === "LOOKING" };
}

export async function getBuyerBoard(user: SessionUser) {
  const feed = await getHomeFeed(user);
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
    where: { userId: user.id },
    include: { listing: true },
    orderBy: { listingId: "asc" },
  });
  return { ...feed, holds, offers, saved };
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
    listing.status !== "ACTIVE" &&
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

export async function getSellerDashboard(userId: string) {
  await applyLifecycle();
  const levers = await getBoardLevers();
  const listings = await prisma.listing.findMany({
    where: { sellerId: userId },
    include: {
      holds: { where: { released: false, expiresAt: { gt: new Date() } } },
      offers: { include: { buyer: true }, orderBy: { createdAt: "desc" } },
      titleSlots: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const blasts = await prisma.blast.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return {
    listings,
    meter: slotMeter(activeCount, levers),
    blasts,
    platformDeposit: levers.titleDeposit,
    levers,
  };
}

export function isFrozenAccount(user: { deletedAt: Date | null; email: string }) {
  return Boolean(user.deletedAt && !user.email.startsWith("deleted-"));
}

export async function getAdminData() {
  const levers = await getBoardLevers();
  const reports = await prisma.report.findMany({
    include: { reporter: true, listing: true },
    orderBy: { createdAt: "desc" },
  });
  const users = await prisma.user.findMany({
    include: {
      strikes: { orderBy: { createdAt: "desc" } },
      listings: { select: { id: true, status: true } },
      offers: { include: { listing: { select: { status: true } } } },
      _count: { select: { mutes: true, mutedBy: true, offers: true, holds: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const listings = await prisma.listing.findMany({
    include: { seller: true, offers: true },
    orderBy: { createdAt: "desc" },
  });
  const adjustments = await prisma.billingAdjustment.findMany({
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });
  const muteRates = users
    .filter((u) => u.role !== "ADMIN")
    .map((u) => {
      const engaged = Math.max(1, u._count.offers + u._count.holds + u._count.mutedBy);
      return {
        user: u,
        mutedBy: u._count.mutedBy,
        rate: u._count.mutedBy / engaged,
        alert: u._count.mutedBy >= 5 && u._count.mutedBy / engaged >= 0.4,
      };
    })
    .sort((a, b) => b.rate - a.rate);
  const fallthroughs = await prisma.offer.findMany({
    where: { status: "ACCEPTED" },
    include: { listing: true, buyer: true },
    orderBy: { createdAt: "desc" },
  });
  const monthStart = thisMonthStart();
  const sellerBilling = users
    .filter((u) => u.role === "SELLER")
    .map((u) => {
      const activeCount = listings.filter((l) => l.sellerId === u.id && l.status === "ACTIVE").length;
      const meter = slotMeter(activeCount, levers);
      const monthAdj = adjustments.filter((a) => a.sellerId === u.id && a.createdAt >= monthStart);
      const adjSum = monthAdj.reduce((sum, a) => sum + a.amount, 0);
      return {
        seller: u,
        meter,
        monthAdj,
        adjSum,
        net: meter.monthly + adjSum,
      };
    });
  return { reports, users, listings, muteRates, fallthroughs, levers, adjustments, sellerBilling };
}

export function personStats(user: {
  role: string;
  fundedCloses: number;
  listings: { status: string }[];
  offers: { status: string; listing: { status: string } }[];
}) {
  const fromOffers = user.offers.filter(
    (o) => o.status === "ACCEPTED" && o.listing.status === "ASSIGNED",
  ).length;
  const fromListings = user.listings.filter((l) => l.status === "ASSIGNED").length;
  const fundedBuys = Math.max(fromOffers, user.role === "BUYER" ? user.fundedCloses : 0);
  const fundedSells = Math.max(fromListings, user.role === "SELLER" ? user.fundedCloses : 0);
  const fallThroughs = user.offers.filter(
    (o) => o.status === "ACCEPTED" && o.listing.status !== "ASSIGNED",
  ).length;
  return { fundedBuys, fundedSells, fallThroughs };
}

export function letterTone(letter: Letter | string | undefined) {
  const key = (letter ?? "").toUpperCase();
  if (key.startsWith("A")) return "green";
  if (key.startsWith("B")) return "yellow";
  return "red";
}

export function displayGradeLabel(letter: Letter | string | undefined) {
  if (!letter || letter === "—") return "—";
  if (letter === "NO_FIT") return "No fit";
  return letter;
}

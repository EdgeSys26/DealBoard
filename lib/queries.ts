import { prisma } from "./prisma";
import { applyLifecycle } from "./lifecycle";
import { gradeAndCache } from "./grade-listing";
import { isHomeVisible, leftover } from "./grade";
import { minOfferPrice } from "./offer-floor";
import { BILLING_BASE, BILLING_EXTRA, INCLUDED_ACTIVE_SLOTS, type Letter } from "./types";
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
  const hidden = await prisma.favorite.findMany({
    where: { userId: user.id, kind: "DONT_SHOW" },
  });
  const hiddenIds = new Set(hidden.map((f) => f.listingId));

  const cards = [];
  for (const listing of listings) {
    if (listing.status !== "ACTIVE") continue;
    if (mutedIds.has(listing.sellerId)) continue;
    if (hiddenIds.has(listing.id)) continue;
    let grade: GradeResult | null = null;
    if (box) {
      grade = await gradeAndCache(listing.id, box.id);
    }
    if (grade && !isHomeVisible(grade.letter)) continue;
    cards.push({ listing, grade });
  }

  cards.sort((a, b) => (b.grade?.score ?? 0) - (a.grade?.score ?? 0));
  return { box, cards, looking: user.lookingStatus === "LOOKING" };
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
  if (listing.status === "ON_HOLD" && user.role === "BUYER" && user.id !== listing.sellerId) {
    return { hidden: true as const, listing: null };
  }

  const box = await getBuyBox(user.id);
  const grade = box ? await gradeAndCache(listing.id, box.id) : null;
  const myHold = listing.holds.find((h) => h.buyerId === user.id);
  const myOffer = listing.offers.find((o) => o.buyerId === user.id);
  const accepted = listing.offers.find((o) => o.status === "ACCEPTED");
  const floor = minOfferPrice(listing.assignmentPrice, listing.offerFloorPct);
  const rehabGuess = listing.rehabEstimate;
  const leftoverNow = leftover(
    listing.platformAvm,
    myOffer?.price ?? listing.assignmentPrice,
    rehabGuess,
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
    photos: JSON.parse(listing.photosJson) as string[],
    showSellerPhone: Boolean(accepted && accepted.buyerId === user.id),
    showWire: Boolean(listing.titleFile?.wireReleased && accepted),
  };
}

export function slotMeter(activeCount: number) {
  const extra = Math.max(0, activeCount - INCLUDED_ACTIVE_SLOTS);
  return {
    activeCount,
    included: INCLUDED_ACTIVE_SLOTS,
    extra,
    monthly: BILLING_BASE + extra * BILLING_EXTRA,
    base: BILLING_BASE,
    extraEach: BILLING_EXTRA,
  };
}

export async function getSellerDashboard(userId: string) {
  await applyLifecycle();
  const listings = await prisma.listing.findMany({
    where: { sellerId: userId },
    include: {
      holds: { where: { released: false, expiresAt: { gt: new Date() } } },
      offers: true,
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
  return { listings, meter: slotMeter(activeCount), blasts };
}

export function isFrozenAccount(user: { deletedAt: Date | null; email: string }) {
  return Boolean(user.deletedAt && !user.email.startsWith("deleted-"));
}

export async function getAdminData() {
  const reports = await prisma.report.findMany({
    include: { reporter: true, listing: true },
    orderBy: { createdAt: "desc" },
  });
  const users = await prisma.user.findMany({
    include: {
      strikes: { orderBy: { createdAt: "desc" } },
      _count: { select: { mutes: true, mutedBy: true, offers: true, holds: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const listings = await prisma.listing.findMany({
    include: { seller: true, offers: true },
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
  return { reports, users, listings, muteRates, fallthroughs };
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

import { prisma } from "./prisma";
import { applyLifecycle } from "./lifecycle";
import { getBoardLevers, type BoardLevers } from "./settings";
import { isUnseenSellerOffer, listingExpiresSoon, sellerBoardStats } from "./seller-board";
import { BILLING_BASE, type Letter } from "./types";

function slotMeter(activeCount: number, levers: BoardLevers) {
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

function thisMonthStart(now = new Date()) {
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
      titleFile: { select: { id: true } },
      favorites: { where: { kind: "FAVORITE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const blasts = await prisma.blast.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const seller = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerOffersSeenAt: true, badge: true, strikes: { select: { id: true } } },
  });
  const seenAt = seller?.sellerOffersSeenAt ?? null;
  const newOfferCount = listings.reduce(
    (n, listing) => n + listing.offers.filter((o) => isUnseenSellerOffer(o, seenAt)).length,
    0,
  );
  const expiringIds = listings.filter((l) => listingExpiresSoon(l)).map((l) => l.id);
  return {
    listings,
    meter: slotMeter(activeCount, levers),
    blasts,
    platformDeposit: levers.titleDeposit,
    levers,
    stats: sellerBoardStats(listings),
    newOfferCount,
    expiringIds,
    sellerBadge: seller?.badge ?? "GREEN",
    strikeCount: seller?.strikes.length ?? 0,
  };
}

export async function getSellerTabBadges(userId: string) {
  const seller = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerOffersSeenAt: true },
  });
  const listings = await prisma.listing.findMany({
    where: { sellerId: userId },
    select: {
      id: true,
      status: true,
      contractExpiresAt: true,
      offers: { select: { status: true, createdAt: true, updatedAt: true, counterPrice: true } },
    },
  });
  const seenAt = seller?.sellerOffersSeenAt ?? null;
  return {
    newOfferCount: listings.reduce(
      (n, listing) => n + listing.offers.filter((o) => isUnseenSellerOffer(o, seenAt)).length,
      0,
    ),
    expiring: listings.some((l) => listingExpiresSoon(l)),
  };
}

export async function markSellerOffersSeen(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { sellerOffersSeenAt: new Date() },
  });
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
    include: { seller: true, offers: { include: { buyer: true } } },
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
  const muteAlerts = muteRates.filter((row) => row.alert);
  const openReports = reports.filter((r) => r.status === "OPEN");
  const tiles = {
    active: listings.filter((l) => l.status === "ACTIVE").length,
    hold: listings.filter((l) => l.status === "ON_HOLD").length,
    pending: listings.filter((l) => l.status === "UNDER_CONTRACT").length,
    sold: listings.filter((l) => l.status === "ASSIGNED").length,
    buyers: users.filter((u) => u.role === "BUYER").length,
    sellers: users.filter((u) => u.role === "SELLER").length,
    openOffers: listings.reduce(
      (n, l) => n + l.offers.filter((o) => o.status === "PENDING" || o.status === "COUNTERED").length,
      0,
    ),
    reports: openReports.length,
    fallThroughs: fallthroughs.length,
    muteAlerts: muteAlerts.length,
    expiring: listings.filter((l) => listingExpiresSoon(l)).length,
    review: listings.filter(
      (l) => !l.verified && l.status !== "EXPIRED" && l.status !== "ASSIGNED",
    ).length,
  };
  const reviewListings = listings.filter(
    (l) => !l.verified && l.status !== "EXPIRED" && l.status !== "ASSIGNED",
  );
  const soldDeals = listings
    .filter((l) => l.status === "ASSIGNED")
    .map((l) => {
      const accepted = l.offers.find((o) => o.status === "ACCEPTED");
      return {
        id: l.id,
        address: l.address,
        sellerId: l.seller.id,
        sellerName: l.seller.name,
        sellerBlocked: l.seller.blacklisted,
        buyerId: accepted?.buyer.id ?? null,
        buyerName: accepted?.buyer.name ?? "—",
        buyerBlocked: accepted?.buyer.blacklisted ?? false,
        price: accepted?.price ?? l.assignmentPrice,
        closedAt: accepted?.updatedAt ?? accepted?.createdAt ?? l.createdAt,
      };
    })
    .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
  return {
    reports,
    users,
    listings,
    muteRates,
    fallthroughs,
    levers,
    adjustments,
    sellerBilling,
    tiles,
    soldDeals,
    reviewListings,
  };
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
  if (!letter || letter === "\u2014") return "\u2014";
  if (letter === "NO_FIT") return "No fit";
  return letter;
}

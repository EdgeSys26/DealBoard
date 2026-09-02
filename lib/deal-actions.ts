"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { applyLifecycle } from "./lifecycle";
import { assertOfferFloor } from "./offer-floor";
import { listingTitleDeposit } from "./deposit";
import { getPlatformTitleDeposit } from "./settings";

function touchOfferPaths(listingId: string) {
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/seller");
  revalidatePath("/home");
  revalidatePath("/deals");
}

export async function markSellerOffersSeenAction() {
  const user = await requireUser();
  if (user.role !== "SELLER" && user.role !== "ADMIN") return;
  const { markSellerOffersSeen } = await import("./queries");
  await markSellerOffersSeen(user.role === "ADMIN" ? "user_seller" : user.id);
  revalidatePath("/seller");
}

async function paperAcceptedOffer(offerId: string, listingId: string) {
  await prisma.offer.update({
    where: { id: offerId },
    data: { status: "ACCEPTED" },
  });
  await prisma.offer.updateMany({
    where: { listingId, id: { not: offerId } },
    data: { status: "REJECTED" },
  });
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "UNDER_CONTRACT" },
  });
  const title = await prisma.titleFile.findUnique({
    where: { listingId },
  });
  if (title) {
    await prisma.titleFile.update({
      where: { id: title.id },
      data: { offerId, wireReleased: true },
    });
  }
}

export async function placeOfferAction(formData: FormData) {
  const user = await requireUser();
  await applyLifecycle();
  const listingId = String(formData.get("listingId"));
  const price = Number(formData.get("price"));
  const closeDate = new Date(String(formData.get("closeDate")));
  const attachPof = String(formData.get("attachPof") || "") === "on";

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE" || !listing.verified) {
    return;
  }

  const existing = await prisma.offer.findFirst({
    where: { listingId, buyerId: user.id, status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] } },
  });
  if (existing) return;

  const floor = assertOfferFloor(price, listing.assignmentPrice, listing.offerFloorPct);
  if (!floor.ok) return;
  const deposit = listingTitleDeposit(listing, await getPlatformTitleDeposit());

  if (attachPof) {
    await prisma.user.update({
      where: { id: user.id },
      data: { pofOnFile: true, entityOnFile: true, w9OnFile: true },
    });
  }

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh?.pofOnFile || !fresh.entityOnFile || !fresh.w9OnFile) {
    return;
  }

  await prisma.offer.create({
    data: {
      listingId,
      buyerId: user.id,
      price,
      deposit,
      closeDate,
      status: "PENDING",
      pofAttached: true,
    },
  });

  await prisma.hold.updateMany({
    where: { listingId, buyerId: user.id, released: false },
    data: { released: true },
  });

  touchOfferPaths(listingId);
}

export async function acceptOfferAction(offerId: string) {
  const user = await requireUser();
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  });
  if (!offer || offer.listing.sellerId !== user.id) {
    return;
  }
  if (offer.status !== "PENDING") return;
  await paperAcceptedOffer(offer.id, offer.listingId);
  touchOfferPaths(offer.listingId);
}

export async function counterOfferAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId"));
  const price = Number(formData.get("price"));
  const closeDate = new Date(String(formData.get("closeDate")));
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  });
  if (!offer || offer.listing.sellerId !== user.id) return;
  if (offer.status !== "PENDING" || offer.counterPrice != null) return;
  if (Number.isNaN(closeDate.getTime())) return;
  const floor = assertOfferFloor(price, offer.listing.assignmentPrice, offer.listing.offerFloorPct);
  if (!floor.ok) return;
  await prisma.offer.update({
    where: { id: offer.id },
    data: {
      status: "COUNTERED",
      counterPrice: price,
      counterCloseDate: closeDate,
    },
  });
  touchOfferPaths(offer.listingId);
}

export async function acceptCounterAction(offerId: string) {
  const user = await requireUser();
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  });
  if (!offer || offer.buyerId !== user.id) return;
  if (offer.status !== "COUNTERED" || offer.counterPrice == null || !offer.counterCloseDate) return;
  await prisma.offer.update({
    where: { id: offer.id },
    data: {
      price: offer.counterPrice,
      closeDate: offer.counterCloseDate,
    },
  });
  await paperAcceptedOffer(offer.id, offer.listingId);
  touchOfferPaths(offer.listingId);
}

export async function declineCounterAction(offerId: string) {
  const user = await requireUser();
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.buyerId !== user.id) return;
  if (offer.status !== "COUNTERED") return;
  await prisma.offer.update({
    where: { id: offer.id },
    data: { status: "DECLINED" },
  });
  touchOfferPaths(offer.listingId);
}

export async function hideListingAction(listingId: string) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (existing?.kind === "HIDDEN") return;
  if (existing) {
    await prisma.favorite.update({ where: { id: existing.id }, data: { kind: "HIDDEN" } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, listingId, kind: "HIDDEN" } });
  }
  revalidatePath("/home");
  revalidatePath(`/listings/${listingId}`);
}

export async function unhideListingAction(listingId: string) {
  const user = await requireUser();
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (!existing || existing.kind !== "HIDDEN") return;
  await prisma.favorite.delete({ where: { id: existing.id } });
  revalidatePath("/home");
  revalidatePath(`/listings/${listingId}`);
}

export async function favoriteAction(listingId: string, kind: "FAVORITE" | "DONT_SHOW") {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  if (kind === "DONT_SHOW") {
    const existing = await prisma.mute.findUnique({
      where: { userId_mutedUserId: { userId: user.id, mutedUserId: listing.sellerId } },
    });
    if (existing) {
      await prisma.mute.delete({ where: { id: existing.id } });
    } else {
      await prisma.mute.create({ data: { userId: user.id, mutedUserId: listing.sellerId } });
    }
  } else {
    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
    });
    if (existing && existing.kind === "FAVORITE") {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else if (existing) {
      await prisma.favorite.update({ where: { id: existing.id }, data: { kind: "FAVORITE" } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, listingId, kind: "FAVORITE" } });
    }
  }
  revalidatePath("/home");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/favorites");
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  const buyerId = user.role === "BUYER" ? user.id : String(formData.get("buyerId"));
  if (listing.status !== "ACTIVE") {
    const accepted = await prisma.offer.findFirst({
      where: { listingId, buyerId, status: "ACCEPTED" },
    });
    if (!accepted) return;
  }
  const sellerId = listing.sellerId;
  let thread = await prisma.thread.findUnique({
    where: { listingId_buyerId: { listingId, buyerId } },
  });
  if (!thread) {
    thread = await prisma.thread.create({
      data: { listingId, buyerId, sellerId },
    });
  }
  if (thread.frozen) {
    return;
  }
  await prisma.message.create({
    data: { threadId: thread.id, senderId: user.id, body },
  });
  revalidatePath("/messages");
  revalidatePath(`/messages/${thread.id}`);
}

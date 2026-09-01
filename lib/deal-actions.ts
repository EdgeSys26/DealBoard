"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { applyLifecycle } from "./lifecycle";
import { assertOfferFloor } from "./offer-floor";
import { listingTitleDeposit } from "./deposit";
import { getPlatformTitleDeposit } from "./settings";

export async function placeOfferAction(formData: FormData) {
  const user = await requireUser();
  await applyLifecycle();
  const listingId = String(formData.get("listingId"));
  const price = Number(formData.get("price"));
  const closeDate = new Date(String(formData.get("closeDate")));
  const attachPof = String(formData.get("attachPof") || "") === "on";

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE") {
    return;
  }

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

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/deals");
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
  await prisma.offer.update({
    where: { id: offerId },
    data: { status: "ACCEPTED" },
  });
  await prisma.offer.updateMany({
    where: { listingId: offer.listingId, id: { not: offerId } },
    data: { status: "REJECTED" },
  });
  await prisma.listing.update({
    where: { id: offer.listingId },
    data: { status: "UNDER_CONTRACT" },
  });

  const title = await prisma.titleFile.findUnique({
    where: { listingId: offer.listingId },
  });
  if (title) {
    await prisma.titleFile.update({
      where: { id: title.id },
      data: { offerId: offer.id, wireReleased: true },
    });
  }

  revalidatePath("/seller");
  revalidatePath(`/listings/${offer.listingId}`);
  revalidatePath("/deals");
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

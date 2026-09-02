import { prisma } from "./prisma";
import { MAX_LIVE_DAYS, MAX_ON_HOLD_DAYS } from "./types";

export async function applyLifecycle(now = new Date()) {
  const listings = await prisma.listing.findMany({
    where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
  });

  for (const listing of listings) {
    if (listing.status === "ACTIVE" && !listing.verified) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: "DRAFT", onHoldUntil: null },
      });
      continue;
    }
    if (listing.contractExpiresAt.getTime() <= now.getTime()) {
      await expireListing(listing.id, "Contract date reached.");
      continue;
    }
    const liveEnd = new Date(listing.liveStartedAt);
    liveEnd.setDate(liveEnd.getDate() + MAX_LIVE_DAYS);
    if (listing.status === "ACTIVE" && liveEnd.getTime() <= now.getTime()) {
      await expireListing(listing.id, "14-day live window ended.");
      continue;
    }
    if (listing.status === "ON_HOLD" && listing.onHoldUntil) {
      if (listing.onHoldUntil.getTime() <= now.getTime()) {
        const stillInLiveWindow = liveEnd.getTime() > now.getTime();
        const canActivate = stillInLiveWindow && listing.verified;
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            status: canActivate ? "ACTIVE" : stillInLiveWindow ? "DRAFT" : "EXPIRED",
            onHoldUntil: null,
          },
        });
        if (canActivate) {
          await unfreezeThreads(listing.id);
        }
      }
    }
  }

  await prisma.hold.updateMany({
    where: { released: false, expiresAt: { lte: now } },
    data: { released: true },
  });
}

async function expireListing(id: string, note: string) {
  await prisma.listing.update({
    where: { id },
    data: { status: "EXPIRED", onHoldUntil: null },
  });
  await prisma.thread.updateMany({
    where: { listingId: id },
    data: { frozen: true, freezeNote: note },
  });
}

export async function freezeThreads(listingId: string, note: string) {
  const threads = await prisma.thread.findMany({ where: { listingId } });
  for (const thread of threads) {
    await prisma.thread.update({
      where: { id: thread.id },
      data: { frozen: true, freezeNote: note },
    });
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: thread.sellerId,
        body: note,
        system: true,
      },
    });
  }
}

export async function unfreezeThreads(listingId: string) {
  await prisma.thread.updateMany({
    where: { listingId },
    data: { frozen: false, freezeNote: null },
  });
}

export function onHoldCapDate(from = new Date(), days = MAX_ON_HOLD_DAYS) {
  const d = new Date(from);
  const n = Number.isFinite(days) && days > 0 ? days : MAX_ON_HOLD_DAYS;
  d.setDate(d.getDate() + n);
  return d;
}

export function sellerPhoneVisible(offerAccepted: boolean) {
  return offerAccepted;
}

import { prisma } from "./prisma";
import { gradeAndCache } from "./grade-listing";
import { isHomeVisible } from "./grade";
import { cityAllowed, parseExcludedCities } from "./area-cities";
import { priceChangeBody } from "./money";

export { priceChangeBody };

export async function notifyAskingPriceChange(
  listingId: string,
  price: number,
  sellerId: string,
) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  const buyerIds = new Set<string>();

  const saved = await prisma.favorite.findMany({
    where: { listingId, kind: "FAVORITE" },
    select: { userId: true },
  });
  for (const row of saved) buyerIds.add(row.userId);

  const open = await prisma.offer.findMany({
    where: { listingId, status: { in: ["PENDING", "COUNTERED"] } },
    select: { buyerId: true },
  });
  for (const row of open) buyerIds.add(row.buyerId);

  if (listing.status === "ACTIVE" && listing.verified) {
    const boxes = await prisma.buyBox.findMany({
      include: { user: { select: { id: true, role: true, lookingStatus: true } } },
    });
    for (const box of boxes) {
      if (box.user.role !== "BUYER") continue;
      if (!cityAllowed(listing.city, parseExcludedCities(box.excludedCities))) continue;
      const grade = await gradeAndCache(listingId, box.id);
      if (grade && isHomeVisible(grade.letter)) buyerIds.add(box.userId);
    }
  }

  const body = priceChangeBody(price);
  for (const buyerId of buyerIds) {
    if (buyerId === sellerId) continue;
    let thread = await prisma.thread.findUnique({
      where: { listingId_buyerId: { listingId, buyerId } },
    });
    if (!thread) {
      thread = await prisma.thread.create({
        data: { listingId, buyerId, sellerId },
      });
    }
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: sellerId,
        body,
        system: true,
      },
    });
  }
}

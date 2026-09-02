import { daysBetween } from "./geo";
import { gradeListing } from "./grade";
import { parseNeedsWork } from "./needs-work";
import { prisma } from "./prisma";
import type { Badge, BuyBoxInput, WorkLevel } from "./types";

export async function gradeAndCache(
  listingId: string,
  buyBoxId: string,
  now = new Date(),
) {
  const [listing, box] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    }),
    prisma.buyBox.findUnique({ where: { id: buyBoxId } }),
  ]);
  if (!listing || !box) return null;

  const photos = JSON.parse(listing.photosJson) as string[];
  const result = gradeListing(
    {
      lat: listing.lat,
      lng: listing.lng,
      assignmentPrice: listing.assignmentPrice,
      platformAvm: listing.platformAvm,
      beds: listing.beds,
      baths: listing.baths,
      sf: listing.sf,
      workLevel: listing.workLevel as WorkLevel,
      needs: parseNeedsWork(listing.needsWorkJson),
      rehabEstimate: listing.rehabEstimate,
      verified: listing.verified,
      sellerBadge: listing.seller.badge as Badge,
      hasWalkthrough: listing.hasWalkthrough,
      photoCount: photos.length,
      daysRemaining: Math.max(0, daysBetween(now, listing.contractExpiresAt)),
    },
    buyBoxFromRow(box),
  );

  await prisma.gradeCache.upsert({
    where: { listingId_buyBoxId: { listingId, buyBoxId } },
    create: {
      listingId,
      buyBoxId,
      letter: result.letter,
      score: result.score,
      isFit: result.isFit,
      barsJson: JSON.stringify(result.bars),
    },
    update: {
      letter: result.letter,
      score: result.score,
      isFit: result.isFit,
      barsJson: JSON.stringify(result.bars),
      computedAt: now,
    },
  });

  return result;
}

export function buyBoxFromRow(box: {
  lat: number;
  lng: number;
  radiusMiles: number;
  maxAssignmentPrice: number;
  minBeds: number | null;
  minSf: number | null;
  workLevels: string;
  willingToFix?: string | null;
  maxRehab: number | null;
}): BuyBoxInput {
  return {
    lat: box.lat,
    lng: box.lng,
    radiusMiles: box.radiusMiles,
    maxAssignmentPrice: box.maxAssignmentPrice,
    minBeds: box.minBeds,
    minSf: box.minSf,
    workLevels: JSON.parse(box.workLevels) as WorkLevel[],
    willingToFix: parseNeedsWork(box.willingToFix),
    maxRehab: box.maxRehab,
  };
}

export async function refreshGradesForBox(buyBoxId: string) {
  const listings = await prisma.listing.findMany({ select: { id: true } });
  for (const listing of listings) {
    await gradeAndCache(listing.id, buyBoxId);
  }
}

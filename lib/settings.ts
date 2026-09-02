import { prisma } from "./prisma";
import {
  BILLING_EXTRA,
  DEFAULT_OFFER_FLOOR_PCT,
  DEFAULT_TITLE_DEPOSIT,
  INCLUDED_ACTIVE_SLOTS,
  MAX_ON_HOLD_DAYS,
} from "./types";
import { PHOTO_NEEDLES } from "./listing-photos";

export type BoardLevers = {
  titleDeposit: number;
  includedActiveSlots: number;
  extraListingDollars: number;
  defaultOfferFloorPct: number;
  onHoldMaxDays: number;
};

export const DEFAULT_LEVERS: BoardLevers = {
  titleDeposit: DEFAULT_TITLE_DEPOSIT,
  includedActiveSlots: INCLUDED_ACTIVE_SLOTS,
  extraListingDollars: BILLING_EXTRA,
  defaultOfferFloorPct: DEFAULT_OFFER_FLOOR_PCT,
  onHoldMaxDays: MAX_ON_HOLD_DAYS,
};

export async function ensureBoardSettings() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PlatformSetting" (
      "id" TEXT PRIMARY KEY,
      "titleDeposit" INTEGER NOT NULL DEFAULT 2500
    )
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "titleDeposit" INTEGER NOT NULL DEFAULT 2500
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSetting" ADD COLUMN IF NOT EXISTS "includedActiveSlots" INTEGER NOT NULL DEFAULT 1
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSetting" ADD COLUMN IF NOT EXISTS "extraListingDollars" INTEGER NOT NULL DEFAULT 49
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSetting" ADD COLUMN IF NOT EXISTS "defaultOfferFloorPct" DOUBLE PRECISION NOT NULL DEFAULT 10
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSetting" ADD COLUMN IF NOT EXISTS "onHoldMaxDays" INTEGER NOT NULL DEFAULT 7
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BillingAdjustment" (
      "id" TEXT PRIMARY KEY,
      "sellerId" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "counterPrice" INTEGER
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "counterCloseDate" TIMESTAMP
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerOffersSeenAt" TIMESTAMP
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "badgeOverride" BOOLEAN NOT NULL DEFAULT false
  `);
  await prisma.$executeRawUnsafe(`
    INSERT INTO "PlatformSetting" (
      "id", "titleDeposit", "includedActiveSlots", "extraListingDollars",
      "defaultOfferFloorPct", "onHoldMaxDays"
    )
    VALUES ('platform', ${DEFAULT_TITLE_DEPOSIT}, ${INCLUDED_ACTIVE_SLOTS}, ${BILLING_EXTRA}, ${DEFAULT_OFFER_FLOOR_PCT}, ${MAX_ON_HOLD_DAYS})
    ON CONFLICT ("id") DO NOTHING
  `);

  const listings = await prisma.listing.findMany({ select: { id: true, address: true, photosJson: true } });
  for (const listing of listings) {
    const match = PHOTO_NEEDLES.find(([needle]) => listing.address.includes(needle));
    if (!match) continue;
    if (listing.photosJson.includes("unsplash.com") && !listing.photosJson.includes(".svg")) continue;
    await prisma.listing.update({
      where: { id: listing.id },
      data: { photosJson: JSON.stringify(match[1]) },
    });
  }

  try {
    const { repairTrustDemo } = await import("./demo-repair");
    await repairTrustDemo(prisma);
  } catch {
    // Demo rows are optional if users are not seeded yet.
  }
}

function clampInt(n: number, fallback: number, min = 1) {
  const v = Math.round(n);
  return Number.isFinite(v) && v >= min ? v : fallback;
}

export async function getBoardLevers(): Promise<BoardLevers> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { id: "platform" } });
    if (!row) return DEFAULT_LEVERS;
    return {
      titleDeposit: row.titleDeposit > 0 ? row.titleDeposit : DEFAULT_LEVERS.titleDeposit,
      includedActiveSlots: row.includedActiveSlots > 0 ? row.includedActiveSlots : DEFAULT_LEVERS.includedActiveSlots,
      extraListingDollars:
        row.extraListingDollars >= 0 ? row.extraListingDollars : DEFAULT_LEVERS.extraListingDollars,
      defaultOfferFloorPct:
        row.defaultOfferFloorPct >= 0 ? row.defaultOfferFloorPct : DEFAULT_LEVERS.defaultOfferFloorPct,
      onHoldMaxDays: row.onHoldMaxDays > 0 ? row.onHoldMaxDays : DEFAULT_LEVERS.onHoldMaxDays,
    };
  } catch {
    return DEFAULT_LEVERS;
  }
}

export async function getPlatformTitleDeposit() {
  return (await getBoardLevers()).titleDeposit;
}

export async function setPlatformTitleDeposit(next: number) {
  const levers = await getBoardLevers();
  return (await setBoardLevers({ ...levers, titleDeposit: next })).titleDeposit;
}

export async function setBoardLevers(next: BoardLevers): Promise<BoardLevers> {
  const value: BoardLevers = {
    titleDeposit: clampInt(next.titleDeposit, DEFAULT_LEVERS.titleDeposit),
    includedActiveSlots: clampInt(next.includedActiveSlots, DEFAULT_LEVERS.includedActiveSlots),
    extraListingDollars: clampInt(next.extraListingDollars, DEFAULT_LEVERS.extraListingDollars, 0),
    defaultOfferFloorPct: Math.min(50, Math.max(0, Number(next.defaultOfferFloorPct) || 0)),
    onHoldMaxDays: clampInt(next.onHoldMaxDays, DEFAULT_LEVERS.onHoldMaxDays),
  };
  await prisma.platformSetting.upsert({
    where: { id: "platform" },
    create: { id: "platform", ...value },
    update: value,
  });
  return value;
}

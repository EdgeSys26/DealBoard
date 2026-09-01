import { prisma } from "./prisma";
import { DEFAULT_TITLE_DEPOSIT } from "./types";
import { PHOTO_NEEDLES } from "./listing-photos";

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
    INSERT INTO "PlatformSetting" ("id", "titleDeposit")
    VALUES ('platform', ${DEFAULT_TITLE_DEPOSIT})
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
}

export async function getPlatformTitleDeposit() {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { id: "platform" } });
    const n = row?.titleDeposit ?? DEFAULT_TITLE_DEPOSIT;
    return n > 0 ? n : DEFAULT_TITLE_DEPOSIT;
  } catch {
    return DEFAULT_TITLE_DEPOSIT;
  }
}

export async function setPlatformTitleDeposit(next: number) {
  const n = Math.round(next);
  const value = Number.isFinite(n) && n > 0 ? n : DEFAULT_TITLE_DEPOSIT;
  await prisma.platformSetting.upsert({
    where: { id: "platform" },
    create: { id: "platform", titleDeposit: value },
    update: { titleDeposit: value },
  });
  return value;
}

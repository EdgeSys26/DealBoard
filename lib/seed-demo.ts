import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { gradeListing } from "./grade";
import { repairTrustDemo } from "./demo-repair";
import { NOBLESVILLE_SQUARE } from "./types";
import type { Badge, WorkLevel } from "./types";

const DEMO_PASSWORD = "demo";

export async function seedDemo(prisma: PrismaClient) {
  const already = await prisma.user.findUnique({ where: { id: "user_buyer" } });
  if (already) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const buyer = await prisma.user.create({
    data: {
      id: "user_buyer",
      email: "buyer@dealboard.local",
      passwordHash,
      role: "BUYER",
      name: "Casey Flint",
      phone: "317-555-0144",
      entityName: "Flint Cash Buys LLC",
      badge: "GREEN",
      fundedCloses: 0,
      lookingStatus: "LOOKING",
      pofOnFile: false,
      entityOnFile: false,
      w9OnFile: false,
      quietHours: true,
    },
  });

  const seller = await prisma.user.create({
    data: {
      id: "user_seller",
      email: "seller@dealboard.local",
      passwordHash,
      role: "SELLER",
      name: "Morgan Hale",
      phone: "317-555-0199",
      entityName: "Midwest Contract Desk LLC",
      badge: "GREEN",
      fundedCloses: 0,
      lookingStatus: "LOOKING",
    },
  });

  const greenSeller = await prisma.user.create({
    data: {
      id: "user_seller_green",
      email: "green@dealboard.local",
      passwordHash,
      role: "SELLER",
      name: "Riley Chen",
      phone: "317-555-0110",
      entityName: "Green Path Wholesale",
      badge: "GREEN",
      fundedCloses: 0,
    },
  });

  await prisma.user.create({
    data: {
      id: "user_admin",
      email: "admin@dealboard.local",
      passwordHash,
      role: "ADMIN",
      name: "Deal Board Admin",
      phone: "317-555-0100",
      entityName: "Deal Board",
      badge: "GOLD",
      fundedCloses: 0,
    },
  });

  const box = await prisma.buyBox.create({
    data: {
      id: "buybox_demo",
      userId: buyer.id,
      centerLabel: NOBLESVILLE_SQUARE.label,
      zip: NOBLESVILLE_SQUARE.zip,
      lat: NOBLESVILLE_SQUARE.lat,
      lng: NOBLESVILLE_SQUARE.lng,
      radiusMiles: 8,
      maxAssignmentPrice: 250_000,
      minBeds: 3,
      minSf: null,
      workLevels: JSON.stringify(["MEDIUM", "FULL_GUT"]),
      maxRehab: null,
      alertMode: "A_AND_B",
    },
  });

  await repairTrustDemo(prisma);

  const pleasant = await prisma.listing.findUniqueOrThrow({ where: { id: "listing_pleasant" } });
  const cicero = await prisma.listing.findUniqueOrThrow({ where: { id: "listing_cicero" } });
  const harbour = await prisma.listing.findUniqueOrThrow({ where: { id: "listing_harbour" } });

  const pleasantComps = [
    { address: "1820 Pleasant St", salePrice: 265000, beds: 3, baths: 1.5, sf: 1188, lat: 40.0448, lng: -86.0196, distanceMi: 0.1, soldDate: "2026-05-12" },
    { address: "1912 Cherry St", salePrice: 271000, beds: 3, baths: 2, sf: 1240, lat: 40.0461, lng: -86.0172, distanceMi: 0.2, soldDate: "2026-04-03" },
    { address: "176 Logan St", salePrice: 288000, beds: 3, baths: 2, sf: 1322, lat: 40.0474, lng: -86.0128, distanceMi: 0.4, soldDate: "2026-06-18" },
    { address: "2108 Pleasant St", salePrice: 255000, beds: 3, baths: 1, sf: 1196, lat: 40.0429, lng: -86.0221, distanceMi: 0.3, soldDate: "2026-03-22" },
    { address: "415 S 10th St", salePrice: 292000, beds: 3, baths: 2, sf: 1410, lat: 40.0433, lng: -86.0099, distanceMi: 0.6, soldDate: "2026-07-09" },
  ];
  await prisma.compSnapshot.createMany({
    data: pleasantComps.map((c) => ({ ...c, listingId: pleasant.id })),
  });
  await prisma.compSnapshot.createMany({
    data: [
      { listingId: cicero.id, address: "640 Cicero Ave", salePrice: 298000, beds: 3, baths: 2, sf: 1380, lat: 40.0502, lng: -86.0131, distanceMi: 0.05, soldDate: "2026-06-02" },
      { listingId: cicero.id, address: "512 Conner St", salePrice: 310000, beds: 3, baths: 2, sf: 1502, lat: 40.0481, lng: -86.0104, distanceMi: 0.2, soldDate: "2026-05-28" },
      { listingId: cicero.id, address: "801 Maple Ave", salePrice: 289000, beds: 3, baths: 2, sf: 1366, lat: 40.0516, lng: -86.0158, distanceMi: 0.2, soldDate: "2026-04-14" },
      { listingId: cicero.id, address: "19 E Harrison St", salePrice: 305000, beds: 3, baths: 2.5, sf: 1444, lat: 40.0466, lng: -86.0089, distanceMi: 0.4, soldDate: "2026-07-01" },
      { listingId: cicero.id, address: "308 S 8th St", salePrice: 276000, beds: 3, baths: 1.5, sf: 1290, lat: 40.0449, lng: -86.0118, distanceMi: 0.4, soldDate: "2026-03-30" },
    ],
  });

  const title = await prisma.titleFile.create({
    data: {
      id: "title_pleasant",
      listingId: pleasant.id,
      company: "First Title of Hamilton County",
      fileNumber: "26-1184",
      depositAmount: 2500,
      officeAddress: "23 S 9th St, Noblesville, IN 46060",
      routingNumber: "074900276",
      accountNumber: "8821-4419-26",
      wireReleased: false,
    },
  });

  await prisma.titleSlot.createMany({
    data: [
      {
        id: "slot_pleasant_827",
        listingId: pleasant.id,
        titleFileId: title.id,
        startsAt: new Date("2026-08-27T10:00:00-04:00"),
        location: "23 S 9th St, in person",
        kind: "IN_PERSON",
        selected: false,
      },
      {
        listingId: pleasant.id,
        titleFileId: title.id,
        startsAt: new Date("2026-08-31T09:00:00-04:00"),
        location: "23 S 9th St, in person",
        kind: "IN_PERSON",
      },
      {
        listingId: pleasant.id,
        titleFileId: title.id,
        startsAt: new Date("2026-09-01T11:00:00-04:00"),
        location: "23 S 9th St, in person",
        kind: "IN_PERSON",
      },
      {
        listingId: pleasant.id,
        titleFileId: title.id,
        startsAt: new Date("2026-09-02T14:00:00-04:00"),
        location: "Video close",
        kind: "VIRTUAL",
      },
    ],
  });

  await prisma.hold.create({
    data: {
      listingId: pleasant.id,
      buyerId: buyer.id,
      expiresAt: new Date(Date.now() + 110 * 60 * 1000),
      released: false,
    },
  });

  const thread = await prisma.thread.create({
    data: {
      id: "thread_pleasant",
      listingId: pleasant.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      frozen: false,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread.id,
        senderId: buyer.id,
        body: "Is the lockbox on the side door? I can walk it tomorrow if the hold holds.",
      },
      {
        threadId: thread.id,
        senderId: seller.id,
        body: "Message here until a bid is accepted — access notes stay in-app. Title is First Title of Hamilton County once we paper it.",
      },
    ],
  });

  await prisma.report.create({
    data: {
      reporterId: buyer.id,
      listingId: harbour.id,
      type: "FAKE",
      notes: "Demo report so admin has something to review. Not a real complaint.",
      status: "OPEN",
    },
  });

  const boxInput = {
    lat: box.lat,
    lng: box.lng,
    radiusMiles: box.radiusMiles,
    maxAssignmentPrice: box.maxAssignmentPrice,
    minBeds: box.minBeds,
    minSf: box.minSf,
    workLevels: JSON.parse(box.workLevels) as WorkLevel[],
    maxRehab: box.maxRehab,
  };

  const morganNow = await prisma.user.findUniqueOrThrow({ where: { id: seller.id } });
  const rileyNow = await prisma.user.findUniqueOrThrow({ where: { id: greenSeller.id } });

  for (const listing of [pleasant, cicero, harbour]) {
    const sellerRow =
      listing.sellerId === seller.id ? morganNow : rileyNow;
    const photos = JSON.parse(listing.photosJson) as string[];
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (listing.contractExpiresAt.getTime() - Date.now()) / 86_400_000,
      ),
    );
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
        rehabEstimate: listing.rehabEstimate,
        verified: listing.verified,
        sellerBadge: sellerRow.badge as Badge,
        hasWalkthrough: listing.hasWalkthrough,
        photoCount: photos.length,
        daysRemaining,
      },
      boxInput,
    );
    await prisma.gradeCache.create({
      data: {
        listingId: listing.id,
        buyBoxId: box.id,
        letter: result.letter,
        score: result.score,
        isFit: result.isFit,
        barsJson: JSON.stringify(result.bars),
      },
    });
  }

  console.log("Seeded Deal Board demo:");
  console.log("  buyer@dealboard.local / demo");
  console.log("  seller@dealboard.local / demo");
  console.log("  admin@dealboard.local / demo");
}

export const DEMO_LOGINS = [
  "buyer@dealboard.local",
  "seller@dealboard.local",
  "admin@dealboard.local",
] as const;

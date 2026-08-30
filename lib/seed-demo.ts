import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { gradeListing } from "./grade";
import { NOBLESVILLE_SQUARE } from "./types";
import type { Badge, WorkLevel } from "./types";

const DEMO_PASSWORD = "demo";

export async function seedDemo(prisma: PrismaClient) {
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.workAgain.deleteMany();
  await prisma.report.deleteMany();
  await prisma.blast.deleteMany();
  await prisma.strike.deleteMany();
  await prisma.mute.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.titleSlot.deleteMany();
  await prisma.titleFile.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.hold.deleteMany();
  await prisma.gradeCache.deleteMany();
  await prisma.compSnapshot.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.buyBox.deleteMany();
  await prisma.user.deleteMany();

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
      badge: "SILVER",
      fundedCloses: 4,
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

  const pleasant = await prisma.listing.create({
    data: {
      id: "listing_pleasant",
      sellerId: seller.id,
      address: "1847 Pleasant St",
      city: "Noblesville",
      state: "IN",
      zip: "46060",
      lat: 40.0442,
      lng: -86.0189,
      assignmentPrice: 189_000,
      originalContractPrice: 171_000,
      sellerArv: 310_000,
      sellerRepairs: 18_000,
      platformAvm: 278_000,
      avmSource: "mock",
      beds: 3,
      baths: 1,
      sf: 1216,
      occupancy: "Vacant",
      access: "Supra lockbox, code in thread after accept",
      contractExpiresAt: new Date("2026-09-10T17:00:00-04:00"),
      knownIssues: "Roof is original (2004). Rear deck boards soft. HVAC runs.",
      photosJson: JSON.stringify([
        "/listings/pleasant-1.svg",
        "/listings/pleasant-2.svg",
        "/listings/pleasant-3.svg",
        "/listings/pleasant-4.svg",
      ]),
      walkthroughUrl: "/walkthrough/pleasant.mp4",
      hasWalkthrough: true,
      contractUploaded: true,
      verified: true,
      workLevel: "MEDIUM",
      rehabEstimate: 12_000,
      status: "ACTIVE",
      offerFloorPct: 10,
      liveStartedAt: new Date("2026-08-19T12:00:00-04:00"),
      views: 47,
    },
  });

  const cicero = await prisma.listing.create({
    data: {
      id: "listing_cicero",
      sellerId: seller.id,
      address: "622 Cicero Ave",
      city: "Noblesville",
      state: "IN",
      zip: "46060",
      lat: 40.0498,
      lng: -86.0134,
      assignmentPrice: 241_000,
      originalContractPrice: 228_000,
      sellerArv: 325_000,
      sellerRepairs: 22_000,
      platformAvm: 300_000,
      avmSource: "mock",
      beds: 3,
      baths: 2,
      sf: 1408,
      occupancy: "Tenant month-to-month",
      access: "Showing window 10a–2p with 2-hour notice",
      contractExpiresAt: new Date("2026-09-05T17:00:00-04:00"),
      knownIssues: "Kitchen is original oak. One bath needs surround.",
      photosJson: JSON.stringify([
        "/listings/cicero-1.svg",
        "/listings/cicero-2.svg",
        "/listings/cicero-3.svg",
      ]),
      walkthroughUrl: "/walkthrough/cicero.mp4",
      hasWalkthrough: true,
      contractUploaded: true,
      verified: true,
      workLevel: "MEDIUM",
      rehabEstimate: 35_000,
      status: "ACTIVE",
      offerFloorPct: 10,
      liveStartedAt: new Date("2026-08-24T12:00:00-04:00"),
      views: 22,
    },
  });

  const harbour = await prisma.listing.create({
    data: {
      id: "listing_harbour",
      sellerId: greenSeller.id,
      address: "401 Harbour Trees Dr",
      city: "Noblesville",
      state: "IN",
      zip: "46062",
      lat: 40.0701,
      lng: -86.0588,
      assignmentPrice: 319_000,
      originalContractPrice: 305_000,
      sellerArv: 340_000,
      sellerRepairs: 6_000,
      platformAvm: 328_000,
      avmSource: "mock",
      beds: 2,
      baths: 2,
      sf: 1104,
      occupancy: "Owner occupied",
      access: "Weekend only",
      contractExpiresAt: new Date("2026-09-12T17:00:00-04:00"),
      knownIssues: "Cosmetic only. HOA $180/mo.",
      photosJson: JSON.stringify(["/listings/harbour-1.svg", "/listings/harbour-2.svg"]),
      hasWalkthrough: false,
      contractUploaded: false,
      verified: false,
      workLevel: "PAINT_CARPET",
      rehabEstimate: 8_000,
      status: "ACTIVE",
      offerFloorPct: 10,
      liveStartedAt: new Date("2026-08-26T12:00:00-04:00"),
      views: 9,
    },
  });

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

  for (const listing of [pleasant, cicero, harbour]) {
    const sellerRow =
      listing.sellerId === seller.id ? seller : greenSeller;
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

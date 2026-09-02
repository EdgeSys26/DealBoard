import type { PrismaClient } from "@prisma/client";
import { recalcUserBadge } from "./badge";
import { photosForSeed } from "./listing-photos";

type ListingSeed = {
  id: string;
  sellerId: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  assignmentPrice: number;
  originalContractPrice: number;
  sellerArv: number;
  sellerRepairs: number;
  platformAvm: number;
  beds: number;
  baths: number;
  sf: number;
  occupancy: string;
  access: string;
  contractExpiresAt: Date;
  knownIssues: string;
  photosKind: "pleasant" | "cicero" | "harbour" | "patriots" | "persistence" | "zionsville";
  contractUploaded: boolean;
  verified: boolean;
  workLevel: string;
  rehabEstimate: number;
  status: string;
  liveStartedAt: Date;
  views: number;
};

const LISTINGS: ListingSeed[] = [
  {
    id: "listing_patriots",
    sellerId: "user_seller",
    address: "254 Patriots Landing Dr",
    city: "Noblesville",
    zip: "46060",
    lat: 40.0524,
    lng: -86.0211,
    assignmentPrice: 205_000,
    originalContractPrice: 188_000,
    sellerArv: 270_000,
    sellerRepairs: 14_000,
    platformAvm: 248_000,
    beds: 3,
    baths: 2,
    sf: 1320,
    occupancy: "Vacant",
    access: "Lockbox after accept",
    contractExpiresAt: new Date("2026-08-01T17:00:00-04:00"),
    knownIssues: "Funded demo close. HVAC replaced 2023.",
    photosKind: "patriots",
    contractUploaded: true,
    verified: true,
    workLevel: "MEDIUM",
    rehabEstimate: 16_000,
    status: "ASSIGNED",
    liveStartedAt: new Date("2026-06-02T12:00:00-04:00"),
    views: 31,
  },
  {
    id: "listing_pleasant",
    sellerId: "user_seller",
    address: "1847 Pleasant St",
    city: "Noblesville",
    zip: "46060",
    lat: 40.0442,
    lng: -86.0189,
    assignmentPrice: 189_000,
    originalContractPrice: 171_000,
    sellerArv: 310_000,
    sellerRepairs: 18_000,
    platformAvm: 278_000,
    beds: 3,
    baths: 1,
    sf: 1216,
    occupancy: "Vacant",
    access: "Supra lockbox, code in thread after accept",
    contractExpiresAt: new Date("2026-09-10T17:00:00-04:00"),
    knownIssues: "Roof is original (2004). Rear deck boards soft. HVAC runs.",
    photosKind: "pleasant",
    contractUploaded: true,
    verified: true,
    workLevel: "MEDIUM",
    rehabEstimate: 12_000,
    status: "ACTIVE",
    liveStartedAt: new Date("2026-08-19T12:00:00-04:00"),
    views: 47,
  },
  {
    id: "listing_cicero",
    sellerId: "user_seller",
    address: "622 Cicero Ave",
    city: "Noblesville",
    zip: "46060",
    lat: 40.0498,
    lng: -86.0134,
    assignmentPrice: 241_000,
    originalContractPrice: 228_000,
    sellerArv: 325_000,
    sellerRepairs: 22_000,
    platformAvm: 300_000,
    beds: 3,
    baths: 2,
    sf: 1408,
    occupancy: "Tenant month-to-month",
    access: "Showing window 10a–2p with 2-hour notice",
    contractExpiresAt: new Date("2026-09-05T17:00:00-04:00"),
    knownIssues: "Kitchen is original oak. One bath needs surround.",
    photosKind: "cicero",
    contractUploaded: true,
    verified: true,
    workLevel: "MEDIUM",
    rehabEstimate: 35_000,
    status: "ACTIVE",
    liveStartedAt: new Date("2026-08-24T12:00:00-04:00"),
    views: 22,
  },
  {
    id: "listing_persistence",
    sellerId: "user_seller",
    address: "900 Persistence Ave",
    city: "Noblesville",
    zip: "46060",
    lat: 40.0388,
    lng: -86.0042,
    assignmentPrice: 176_000,
    originalContractPrice: 164_000,
    sellerArv: 240_000,
    sellerRepairs: 11_000,
    platformAvm: 228_000,
    beds: 3,
    baths: 1.5,
    sf: 1188,
    occupancy: "Vacant",
    access: "TBD",
    contractExpiresAt: new Date("2026-09-18T17:00:00-04:00"),
    knownIssues: "Draft — no contract on file.",
    photosKind: "persistence",
    contractUploaded: false,
    verified: false,
    workLevel: "PAINT_CARPET",
    rehabEstimate: 9_000,
    status: "DRAFT",
    liveStartedAt: new Date("2026-08-28T12:00:00-04:00"),
    views: 0,
  },
  {
    id: "listing_harbour",
    sellerId: "user_seller_green",
    address: "401 Harbour Trees Dr",
    city: "Noblesville",
    zip: "46062",
    lat: 40.0701,
    lng: -86.0588,
    assignmentPrice: 319_000,
    originalContractPrice: 305_000,
    sellerArv: 340_000,
    sellerRepairs: 6_000,
    platformAvm: 328_000,
    beds: 2,
    baths: 2,
    sf: 1104,
    occupancy: "Owner occupied",
    access: "Weekend only",
    contractExpiresAt: new Date("2026-09-12T17:00:00-04:00"),
    knownIssues: "Cosmetic only. HOA $180/mo.",
    photosKind: "harbour",
    contractUploaded: false,
    verified: false,
    workLevel: "PAINT_CARPET",
    rehabEstimate: 8_000,
    status: "DRAFT",
    liveStartedAt: new Date("2026-08-26T12:00:00-04:00"),
    views: 9,
  },
  {
    id: "listing_zionsville",
    sellerId: "user_seller",
    address: "355 Mulberry St",
    city: "Zionsville",
    zip: "46077",
    lat: 39.9509,
    lng: -86.2619,
    assignmentPrice: 229_000,
    originalContractPrice: 214_000,
    sellerArv: 275_000,
    sellerRepairs: 12_000,
    platformAvm: 268_000,
    beds: 3,
    baths: 2,
    sf: 1360,
    occupancy: "Vacant",
    access: "Lockbox",
    contractExpiresAt: new Date("2026-09-14T17:00:00-04:00"),
    knownIssues: "Verified Active 3-bed in 46077 for radius include/exclude.",
    photosKind: "zionsville",
    contractUploaded: true,
    verified: true,
    workLevel: "MEDIUM",
    rehabEstimate: 14_000,
    status: "ACTIVE",
    liveStartedAt: new Date("2026-08-27T12:00:00-04:00"),
    views: 6,
  },
];

const GOLD_ADDRESSES = [
  "51 Maple Run Ct",
  "53 Maple Run Ct",
  "55 Maple Run Ct",
  "57 Maple Run Ct",
  "59 Maple Run Ct",
];

function listingData(row: ListingSeed) {
  return {
    sellerId: row.sellerId,
    address: row.address,
    city: row.city,
    state: "IN",
    zip: row.zip,
    lat: row.lat,
    lng: row.lng,
    assignmentPrice: row.assignmentPrice,
    originalContractPrice: row.originalContractPrice,
    sellerArv: row.sellerArv,
    sellerRepairs: row.sellerRepairs,
    platformAvm: row.platformAvm,
    avmSource: "mock",
    beds: row.beds,
    baths: row.baths,
    sf: row.sf,
    occupancy: row.occupancy,
    access: row.access,
    contractExpiresAt: row.contractExpiresAt,
    knownIssues: row.knownIssues,
    photosJson: JSON.stringify(photosForSeed(row.photosKind)),
    titleDeposit: 2500,
    hasWalkthrough: row.verified,
    walkthroughUrl: row.verified ? `/walkthrough/${row.photosKind}.mp4` : null,
    contractUploaded: row.contractUploaded,
    verified: row.verified,
    workLevel: row.workLevel,
    rehabEstimate: row.rehabEstimate,
    status: row.status,
    offerFloorPct: 10,
    liveStartedAt: row.liveStartedAt,
    views: row.views,
    onHoldUntil: null,
  };
}

export async function repairTrustDemo(prisma: PrismaClient) {
  const morgan = await prisma.user.findUnique({ where: { id: "user_seller" } });
  const riley = await prisma.user.findUnique({ where: { id: "user_seller_green" } });
  if (!morgan || !riley) return;

  await prisma.user.update({
    where: { id: morgan.id },
    data: { name: "Morgan Hale", badgeOverride: false },
  });
  await prisma.user.update({
    where: { id: riley.id },
    data: { name: "Riley Chen", badge: "GREEN", fundedCloses: 0, badgeOverride: false },
  });

  let gold = await prisma.user.findUnique({ where: { id: "user_seller_gold" } });
  if (!gold) {
    gold = await prisma.user.create({
      data: {
        id: "user_seller_gold",
        email: "gold@dealboard.local",
        passwordHash: morgan.passwordHash,
        role: "SELLER",
        name: "Avery Cole",
        phone: "317-555-0177",
        entityName: "Cole Five Closes",
        badge: "GREEN",
        badgeOverride: false,
        fundedCloses: 0,
        lookingStatus: "LOOKING",
      },
    });
  } else {
    await prisma.user.update({
      where: { id: gold.id },
      data: { name: "Avery Cole", badgeOverride: false },
    });
  }

  for (const row of LISTINGS) {
    const data = listingData(row);
    const existing = await prisma.listing.findUnique({ where: { id: row.id } });
    if (!existing) {
      await prisma.listing.create({ data: { id: row.id, ...data } });
      continue;
    }
    const pinTrust =
      row.id === "listing_patriots" ||
      row.id === "listing_pleasant" ||
      row.id === "listing_cicero" ||
      row.id === "listing_zionsville";
    const demoteLiveUnverified = existing.status === "ACTIVE" && !existing.verified;
    await prisma.listing.update({
      where: { id: row.id },
      data: {
        sellerId: data.sellerId,
        address: data.address,
        city: data.city,
        zip: data.zip,
        lat: data.lat,
        lng: data.lng,
        photosJson: data.photosJson,
        ...(pinTrust
          ? {
              contractUploaded: true,
              verified: true,
              status: row.status,
              onHoldUntil: null,
            }
          : demoteLiveUnverified
            ? { status: "DRAFT", onHoldUntil: null }
            : {}),
      },
    });
  }

  for (let i = 0; i < GOLD_ADDRESSES.length; i += 1) {
    const id = `listing_gold_${i + 1}`;
    const created = new Date(Date.now() - (i + 1) * 21 * 86_400_000);
    await prisma.listing.upsert({
      where: { id },
      create: {
        id,
        sellerId: gold.id,
        address: GOLD_ADDRESSES[i],
        city: "Noblesville",
        state: "IN",
        zip: "46060",
        lat: 40.041 + i * 0.002,
        lng: -86.01 - i * 0.002,
        assignmentPrice: 198_000 + i * 4000,
        originalContractPrice: 180_000 + i * 3500,
        sellerArv: 260_000,
        sellerRepairs: 10_000,
        platformAvm: 245_000,
        avmSource: "mock",
        beds: 3,
        baths: 2,
        sf: 1240,
        occupancy: "Vacant",
        access: "Closed",
        contractExpiresAt: created,
        knownIssues: "Dummy funded close for Gold badge.",
        photosJson: JSON.stringify(photosForSeed("pleasant")),
        titleDeposit: 2500,
        hasWalkthrough: true,
        contractUploaded: true,
        verified: true,
        workLevel: "MEDIUM",
        rehabEstimate: 12_000,
        status: "ASSIGNED",
        offerFloorPct: 10,
        liveStartedAt: created,
        views: 4,
      },
      update: {
        sellerId: gold.id,
        address: GOLD_ADDRESSES[i],
        status: "ASSIGNED",
        verified: true,
        contractUploaded: true,
      },
    });
  }

  await prisma.listing.updateMany({
    where: { status: "ACTIVE", verified: false },
    data: { status: "DRAFT", onHoldUntil: null },
  });

  await recalcUserBadge(morgan.id);
  await recalcUserBadge(riley.id);
  await recalcUserBadge(gold.id);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  clearSession,
  createSession,
  getSessionUser,
  requireUser,
  verifyPassword,
} from "./auth";
import { ensureDemoDb } from "./ensure-demo";
import { refreshGradesForBox } from "./grade-listing";
import { applyLifecycle, freezeThreads, onHoldCapDate, unfreezeThreads } from "./lifecycle";
import { assertOfferFloor, tightenFloorPct } from "./offer-floor";
import { HOLD_MS, NOBLESVILLE_SQUARE, type AlertMode, type WorkLevel } from "./types";
import { clampListingDeposit, listingTitleDeposit } from "./deposit";
import { getBoardLevers, getPlatformTitleDeposit } from "./settings";
import { PHOTO_NEW } from "./listing-photos";

export async function loginAction(formData: FormData) {
  await ensureDemoDb();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    return;
  }
  if (user.blacklisted) {
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return;
  await createSession(user.id);
  if (user.role === "SELLER") redirect("/seller");
  if (user.role === "ADMIN") redirect("/admin");
  redirect("/home");
}

export async function demoLoginAction(formData: FormData) {
  await ensureDemoDb();
  const role = String(formData.get("role") || "").toUpperCase();
  if (role !== "BUYER" && role !== "SELLER" && role !== "ADMIN") return;
  const email =
    role === "BUYER"
      ? "buyer@dealboard.local"
      : role === "SELLER"
        ? "seller@dealboard.local"
        : "admin@dealboard.local";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await createSession(user.id);
  revalidatePath("/", "layout");
  if (role === "SELLER") redirect("/seller");
  if (role === "ADMIN") redirect("/admin");
  redirect("/home");
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveBuyBoxAction(formData: FormData) {
  const user = await requireUser();
  const radiusMiles = Number(formData.get("radiusMiles"));
  const maxAssignmentPrice = Number(formData.get("maxAssignmentPrice"));
  const minBedsRaw = String(formData.get("minBeds") || "");
  const minSfRaw = String(formData.get("minSf") || "");
  const maxRehabRaw = String(formData.get("maxRehab") || "");
  const workLevels = formData.getAll("workLevels").map(String) as WorkLevel[];
  const rawAlert = String(formData.get("alertMode") || "A_AND_B");
  const alertMode: AlertMode =
    rawAlert === "A_ONLY" || rawAlert === "APP_ONLY" ? rawAlert : "A_AND_B";
  const zip = String(formData.get("zip") || NOBLESVILLE_SQUARE.zip);
  const centerLabel = String(formData.get("centerLabel") || NOBLESVILLE_SQUARE.label);

  if (!workLevels.length) {
    return;
  }

  const existing = await prisma.buyBox.findFirst({ where: { userId: user.id } });
  const { citiesIntersectingCircle, mergeExcludedCities, parseExcludedCities } = await import("./area-cities");
  const chipCities = citiesIntersectingCircle(
    { lat: NOBLESVILLE_SQUARE.lat, lng: NOBLESVILLE_SQUARE.lng },
    radiusMiles,
  );
  const selectedCities = formData.getAll("cities").map(String);
  const excludedCities = JSON.stringify(
    mergeExcludedCities(parseExcludedCities(existing?.excludedCities), chipCities, selectedCities),
  );
  const data = {
    userId: user.id,
    centerLabel,
    zip,
    lat: NOBLESVILLE_SQUARE.lat,
    lng: NOBLESVILLE_SQUARE.lng,
    radiusMiles,
    maxAssignmentPrice,
    minBeds: minBedsRaw ? Number(minBedsRaw) : null,
    minSf: minSfRaw ? Number(minSfRaw) : null,
    workLevels: JSON.stringify(workLevels),
    maxRehab: maxRehabRaw ? Number(maxRehabRaw) : null,
    alertMode,
    excludedCities,
  };
  const box = existing
    ? await prisma.buyBox.update({ where: { id: existing.id }, data })
    : await prisma.buyBox.create({ data: { id: `buybox_${user.id}`, ...data } });
  await refreshGradesForBox(box.id);
  revalidatePath("/home");
  revalidatePath("/buy-box");
  redirect("/buy-box");
}

export async function toggleCityFilterAction(formData: FormData) {
  const user = await requireUser();
  const city = String(formData.get("city") || "").trim();
  if (!city) return;
  const box = await prisma.buyBox.findFirst({ where: { userId: user.id } });
  if (!box) return;
  const { parseExcludedCities } = await import("./area-cities");
  const excluded = parseExcludedCities(box.excludedCities);
  const next = excluded.includes(city)
    ? excluded.filter((item) => item !== city)
    : [...excluded, city];
  await prisma.buyBox.update({
    where: { id: box.id },
    data: { excludedCities: JSON.stringify(next) },
  });
  revalidatePath("/home");
  revalidatePath("/buy-box");
  if (String(formData.get("view") || "") === "all") {
    redirect("/home?view=all");
  }
}

export async function toggleLookingAction(formData?: FormData) {
  const user = await requireUser();
  const next = user.lookingStatus === "LOOKING" ? "PAUSED" : "LOOKING";
  await prisma.user.update({
    where: { id: user.id },
    data: { lookingStatus: next },
  });
  revalidatePath("/home");
  revalidatePath("/settings");
  if (formData && String(formData.get("view") || "") === "all") {
    redirect("/home?view=all");
  }
}

export async function toggleQuietHoursAction() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { quietHours: !user.quietHours },
  });
  revalidatePath("/settings");
}

export async function holdListingAction(listingId: string) {
  const user = await requireUser();
  await applyLifecycle();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE" || !listing.verified) {
    return;
  }
  const existing = await prisma.hold.findFirst({
    where: { listingId, released: false, expiresAt: { gt: new Date() } },
  });
  if (existing) {
    return;
  }
  await prisma.hold.create({
    data: {
      listingId,
      buyerId: user.id,
      expiresAt: new Date(Date.now() + HOLD_MS),
    },
  });
  await prisma.listing.update({
    where: { id: listingId },
    data: { views: { increment: 0 } },
  });
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/home");
}

export async function placeOfferAction(formData: FormData) {
  const user = await requireUser();
  await applyLifecycle();
  const listingId = String(formData.get("listingId"));
  const price = Number(formData.get("price"));
  const closeDate = new Date(String(formData.get("closeDate")));
  const attachPof = String(formData.get("attachPof") || "") === "on";
  const rehabGuess = Number(formData.get("rehabGuess") || 0);

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE" || !listing.verified) {
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
  return;
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
    const preferred = await prisma.titleSlot.findFirst({
      where: { listingId: offer.listingId, id: "slot_pleasant_827" },
    });
    await prisma.titleFile.update({
      where: { id: title.id },
      data: {
        offerId: offer.id,
        wireReleased: true,
        selectedSlotId: preferred?.id ?? title.selectedSlotId,
      },
    });
    if (preferred) {
      await prisma.titleSlot.update({
        where: { id: preferred.id },
        data: { selected: true },
      });
    }
  }

  revalidatePath("/seller");
  revalidatePath(`/listings/${offer.listingId}`);
  revalidatePath("/deals");
}

export async function pickTitleSlotAction(slotId: string) {
  const user = await requireUser();
  const slot = await prisma.titleSlot.findUnique({
    where: { id: slotId },
    include: { listing: { include: { offers: true, titleFile: true } } },
  });
  if (!slot) return;
  const accepted = slot.listing.offers.find(
    (o) => o.status === "ACCEPTED" && o.buyerId === user.id,
  );
  if (!accepted) return;
  await prisma.titleSlot.updateMany({
    where: { listingId: slot.listingId },
    data: { selected: false },
  });
  await prisma.titleSlot.update({ where: { id: slotId }, data: { selected: true } });
  if (slot.listing.titleFile) {
    await prisma.titleFile.update({
      where: { id: slot.listing.titleFile.id },
      data: { selectedSlotId: slotId },
    });
  }
  revalidatePath(`/listings/${slot.listingId}`);
  revalidatePath("/deals");
}

export async function setListingStatusAction(listingId: string, status: string) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || (listing.sellerId !== user.id && user.role !== "ADMIN")) {
    return;
  }
  if (!["DRAFT", "ACTIVE", "ON_HOLD", "UNDER_CONTRACT", "ASSIGNED", "EXPIRED"].includes(status)) {
    return;
  }
  if (status === "ACTIVE" && !listing.verified) {
    return;
  }

  if (status === "ON_HOLD") {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "ON_HOLD", onHoldUntil: onHoldCapDate(new Date(), (await getBoardLevers()).onHoldMaxDays) },
    });
    await freezeThreads(
      listingId,
      "Seller placed this listing on hold. The thread is frozen. On-hold listings are hidden from buyers and are not billed.",
    );
  } else if (status === "ACTIVE") {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "ACTIVE", onHoldUntil: null },
    });
    await unfreezeThreads(listingId);
  } else {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status, onHoldUntil: null },
    });
  }
  if (status === "ASSIGNED") {
    const { recalcOnFundedClose } = await import("./badge");
    await recalcOnFundedClose(listingId);
  }
  revalidatePath("/seller");
  revalidatePath("/home");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/messages");
  revalidatePath("/admin");
}

export async function tightenFloorAction(listingId: string, formData: FormData) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return;
  const next = Number(formData.get("offerFloorPct"));
  const levers = await getBoardLevers();
  await prisma.listing.update({
    where: { id: listingId },
    data: { offerFloorPct: tightenFloorPct(listing.offerFloorPct, next, levers.defaultOfferFloorPct) },
  });
  revalidatePath("/seller");
}

export async function setListingDepositAction(listingId: string, formData: FormData) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return;
  const next = clampListingDeposit(Number(formData.get("titleDeposit")), await getPlatformTitleDeposit());
  await prisma.listing.update({
    where: { id: listingId },
    data: { titleDeposit: next },
  });
  revalidatePath("/seller");
  revalidatePath(`/listings/${listingId}`);
}

export async function saveListingRowAction(listingId: string, formData: FormData) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || (listing.sellerId !== user.id && user.role !== "ADMIN")) return;
  const levers = await getBoardLevers();
  const nextFloor = tightenFloorPct(
    listing.offerFloorPct,
    Number(formData.get("offerFloorPct")),
    levers.defaultOfferFloorPct,
  );
  const nextDeposit = clampListingDeposit(
    Number(formData.get("titleDeposit")),
    await getPlatformTitleDeposit(),
  );
  await prisma.listing.update({
    where: { id: listingId },
    data: { offerFloorPct: nextFloor, titleDeposit: nextDeposit },
  });
  revalidatePath("/seller");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/seller/listings/${listingId}`);
}

export async function saveListingAskingAction(listingId: string, formData: FormData) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || (listing.sellerId !== user.id && user.role !== "ADMIN")) return;
  const next = Math.round(Number(formData.get("assignmentPrice")));
  if (!Number.isFinite(next) || next <= 0) return;
  if (next !== listing.assignmentPrice) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { assignmentPrice: next },
    });
    const { notifyAskingPriceChange } = await import("./price-notify");
    await notifyAskingPriceChange(listingId, next, listing.sellerId);
  }
  revalidatePath("/seller");
  revalidatePath("/home");
  revalidatePath("/messages");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/seller/listings/${listingId}`);
}

export async function favoriteAction(listingId: string, kind: "FAVORITE" | "DONT_SHOW") {
  const user = await requireUser();
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (existing && existing.kind === kind) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.favorite.update({ where: { id: existing.id }, data: { kind } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, listingId, kind } });
  }
  revalidatePath("/home");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/favorites");
}

export async function reportListingAction(formData: FormData) {
  const user = await requireUser();
  await prisma.report.create({
    data: {
      reporterId: user.id,
      listingId: String(formData.get("listingId")),
      type: String(formData.get("type")),
      notes: String(formData.get("notes") || ""),
      status: "OPEN",
    },
  });
  revalidatePath("/admin");
  return;
}

export async function blockUserAction(mutedUserId: string) {
  const user = await requireUser();
  await prisma.mute.upsert({
    where: { userId_mutedUserId: { userId: user.id, mutedUserId } },
    create: { userId: user.id, mutedUserId },
    update: {},
  });
  revalidatePath("/messages");
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  if (listing.status === "ON_HOLD") {
    return;
  }
  const buyerId = user.role === "BUYER" ? user.id : String(formData.get("buyerId"));
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

export async function saveVaultAction(formData: FormData) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      pofOnFile: String(formData.get("pofOnFile")) === "on",
      entityOnFile: String(formData.get("entityOnFile")) === "on",
      w9OnFile: String(formData.get("w9OnFile")) === "on",
      entityName: String(formData.get("entityName") || user.entityName || ""),
    },
  });
  revalidatePath("/vault");
}

export async function deleteAccountAction() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletedAt: new Date(),
      email: `deleted-${user.id}@dealboard.invalid`,
      name: "Deleted account",
      phone: "",
    },
  });
  await clearSession();
  redirect("/");
}

export async function blacklistAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const targetId = String(formData.get("userId"));
  const note = String(formData.get("note") || "");
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return;
  await prisma.user.update({
    where: { id: targetId },
    data: {
      blacklisted: true,
      blacklistNote: `account=${target.id};entity=${target.entityName};phone=${target.phone};email=${target.email}; ${note}`,
    },
  });
  revalidatePath("/admin");
}

export async function resolveReportAction(reportId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  await prisma.report.update({
    where: { id: reportId },
    data: { status: "REVIEWED" },
  });
  revalidatePath("/admin");
}

export async function sendBlastAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "SELLER") return;
  await prisma.blast.create({
    data: {
      sellerId: user.id,
      listingId: String(formData.get("listingId") || "") || null,
      message: String(formData.get("message") || ""),
    },
  });
  revalidatePath("/seller");
  return;
}

export async function startHotAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "SELLER" && user.role !== "ADMIN") return;
  const listingId = String(formData.get("listingId") || "");
  const { evaluateHot, hotPlan, isListingHot, lastHotEndedAt, hotCooldownUntil } = await import("./hot");
  const plan = hotPlan(Number(formData.get("hours")));
  if (!listingId || !plan) return;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      seller: { include: { strikes: { select: { id: true } } } },
      titleFile: { select: { id: true } },
    },
  });
  if (!listing) return;
  const sellerId = user.role === "ADMIN" ? listing.sellerId : user.id;
  if (listing.sellerId !== sellerId) return;
  const siblings = await prisma.listing.findMany({
    where: { sellerId: listing.sellerId },
    select: { id: true, hotUntil: true },
  });
  const now = new Date();
  const gate = evaluateHot({
    badge: listing.seller.badge,
    strikeCount: listing.seller.strikes.length,
    verified: listing.verified,
    status: listing.status,
    hasTitle: Boolean(listing.titleFile),
    listingHot: isListingHot(listing, now),
    sellerHasLiveHot: siblings.some((row) => row.id !== listing.id && isListingHot(row, now)),
    cooldownUntil: hotCooldownUntil(lastHotEndedAt(siblings)),
    now,
  });
  if (!gate.ok) return;
  const hotUntil = new Date(now.getTime() + plan.hours * 60 * 60 * 1000);
  await prisma.listing.update({
    where: { id: listingId },
    data: { hotUntil, hotHours: plan.hours },
  });
  await prisma.billingAdjustment.create({
    data: {
      sellerId: listing.sellerId,
      amount: plan.dollars,
      reason: `Hot ${plan.label} · ${listing.address}`,
    },
  });
  await prisma.blast.create({
    data: {
      sellerId: listing.sellerId,
      listingId,
      message: `Hot ${plan.label} · ${listing.address} · A/B only`,
    },
  });
  revalidatePath("/seller");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath(`/listings/${listingId}`);
}

export async function createListingAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    redirect("/home");
  }
  const sellerId = user.role === "ADMIN" ? "user_seller" : user.id;
  const walkthrough = String(formData.get("hasWalkthrough")) === "on";
  const photos = [PHOTO_NEW];
  const assignmentPrice = Number(formData.get("assignmentPrice"));
  const sellerArv = Number(formData.get("sellerArv") || 0) || null;
  const liveAvm = Boolean(process.env.RENTCAST_API_KEY || process.env.REAPI_API_KEY);
  const explicitAvm = Number(formData.get("platformAvm") || 0) || null;
  const platformAvm =
    explicitAvm ||
    (liveAvm ? null : sellerArv || Math.round(assignmentPrice * 1.35));
  const expiresAt = new Date(String(formData.get("contractExpiresAt")));
  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error("Contract expiration is required");
  }
  const listing = await prisma.listing.create({
    data: {
      id: `listing_${Date.now()}`,
      sellerId,
      address: String(formData.get("address")),
      city: String(formData.get("city") || "Noblesville"),
      state: "IN",
      zip: String(formData.get("zip") || "46060"),
      lat: NOBLESVILLE_SQUARE.lat + 0.01,
      lng: NOBLESVILLE_SQUARE.lng - 0.01,
      assignmentPrice,
      originalContractPrice: Number(formData.get("originalContractPrice")),
      sellerArv,
      sellerRepairs: Number(formData.get("sellerRepairs") || 0) || null,
      platformAvm,
      avmSource: liveAvm ? "live" : "mock",
      beds: Number(formData.get("beds")),
      baths: Number(formData.get("baths")),
      sf: Number(formData.get("sf")),
      occupancy: String(formData.get("occupancy") || "Vacant"),
      access: String(formData.get("access") || "TBD"),
      contractExpiresAt: expiresAt,
      knownIssues: String(formData.get("knownIssues") || ""),
      photosJson: JSON.stringify(photos),
      hasWalkthrough: walkthrough,
      walkthroughUrl: walkthrough ? "/walkthrough/new.mp4" : null,
      contractUploaded: String(formData.get("contractUploaded")) === "on",
      verified: false,
      workLevel: String(formData.get("workLevel")),
      rehabEstimate: Number(formData.get("rehabEstimate") || 0),
      offerFloorPct: Number(formData.get("offerFloorPct") || (await getBoardLevers()).defaultOfferFloorPct),
      titleDeposit: clampListingDeposit(
        Number(formData.get("titleDeposit")),
        await getPlatformTitleDeposit(),
      ),
      status: "DRAFT",
      liveStartedAt: new Date(),
    },
  });
  console.log("createListingAction persisted", listing.id, listing.address, listing.sellerId);
  const boxes = await prisma.buyBox.findMany();
  for (const box of boxes) {
    const { gradeAndCache } = await import("./grade-listing");
    await gradeAndCache(listing.id, box.id);
  }
  revalidatePath("/seller");
  revalidatePath("/home");
  redirect("/seller");
}

export async function workAgainAction(listingId: string, toUserId: string, yes: boolean) {
  const user = await requireUser();
  await prisma.workAgain.create({
    data: { fromUserId: user.id, toUserId, listingId, yes },
  });
  revalidatePath("/owned");
}

export async function incrementViewAction(listingId: string) {
  await prisma.listing.update({
    where: { id: listingId },
    data: { views: { increment: 1 } },
  });
}

export async function getCurrentUser() {
  return getSessionUser();
}

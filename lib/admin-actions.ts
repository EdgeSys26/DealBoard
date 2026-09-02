"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { freezeThreads } from "./lifecycle";

export async function freezeUserAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const targetId = String(formData.get("userId"));
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.role === "ADMIN") return;
  await prisma.user.update({
    where: { id: targetId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/admin");
}

export async function unfreezeUserAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const targetId = String(formData.get("userId"));
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.email.startsWith("deleted-")) return;
  await prisma.user.update({
    where: { id: targetId },
    data: { deletedAt: null },
  });
  revalidatePath("/admin");
}

export async function expireListingAdminAction(listingId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "EXPIRED", onHoldUntil: null },
  });
  await freezeThreads(listingId, "Admin expired this listing.");
  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/seller");
}

export async function killListingAdminAction(listingId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "EXPIRED", onHoldUntil: null },
  });
  await freezeThreads(listingId, "Admin killed this listing.");
  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/seller");
}

export async function setPlatformTitleDepositAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const { setPlatformTitleDeposit } = await import("./settings");
  await setPlatformTitleDeposit(Number(formData.get("titleDeposit")));
  revalidatePath("/admin");
  revalidatePath("/seller");
  revalidatePath("/home");
}

export async function setPlatformLeversAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const { getBoardLevers, setBoardLevers } = await import("./settings");
  const current = await getBoardLevers();
  await setBoardLevers({
    titleDeposit: Number(formData.get("titleDeposit") ?? current.titleDeposit),
    includedActiveSlots: Number(formData.get("includedActiveSlots") ?? current.includedActiveSlots),
    extraListingDollars: Number(formData.get("extraListingDollars") ?? current.extraListingDollars),
    defaultOfferFloorPct: Number(formData.get("defaultOfferFloorPct") ?? current.defaultOfferFloorPct),
    onHoldMaxDays: Number(formData.get("onHoldMaxDays") ?? current.onHoldMaxDays),
  });
  revalidatePath("/admin");
  revalidatePath("/seller");
  revalidatePath("/home");
}

export async function strikeUserAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const targetId = String(formData.get("userId") || "");
  const reason = String(formData.get("reason") || "Sold deal review").trim() || "Sold deal review";
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.role === "ADMIN") return;
  await prisma.strike.create({ data: { userId: targetId, reason } });
  const { recalcUserBadge } = await import("./badge");
  await recalcUserBadge(targetId);
  revalidatePath("/admin");
}

export async function verifyListingAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const listingId = String(formData.get("listingId") || "");
  if (!listingId) return;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  await prisma.listing.update({
    where: { id: listingId },
    data: { verified: true },
  });
  revalidatePath("/admin");
  revalidatePath("/seller");
  revalidatePath(`/listings/${listingId}`);
}

export async function rejectListingAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const listingId = String(formData.get("listingId") || "");
  if (!listingId) return;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  await prisma.listing.update({
    where: { id: listingId },
    data: { verified: false, status: "DRAFT", onHoldUntil: null },
  });
  revalidatePath("/admin");
  revalidatePath("/seller");
  revalidatePath("/home");
  revalidatePath(`/listings/${listingId}`);
}

export async function setBadgeOverrideAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const targetId = String(formData.get("userId") || "");
  const { parseBadgeOverride, recalcUserBadge } = await import("./badge");
  const next = parseBadgeOverride(String(formData.get("badge") || ""));
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.role === "ADMIN" || !next) return;
  if (next === "AUTO") {
    await prisma.user.update({
      where: { id: targetId },
      data: { badgeOverride: false },
    });
    await recalcUserBadge(targetId);
  } else {
    await prisma.user.update({
      where: { id: targetId },
      data: { badge: next, badgeOverride: true },
    });
  }
  revalidatePath("/admin");
}

export async function addBillingAdjustmentAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const sellerId = String(formData.get("sellerId") || "");
  const raw = Math.abs(Math.round(Number(formData.get("amount"))));
  const sign = String(formData.get("sign") || "+") === "-" ? -1 : 1;
  const reason = String(formData.get("reason") || "").trim();
  if (!sellerId || !Number.isFinite(raw) || raw <= 0 || !reason) return;
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== "SELLER") return;
  await prisma.billingAdjustment.create({
    data: { sellerId, amount: raw * sign, reason },
  });
  revalidatePath("/admin");
}

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
import { applyLifecycle, freezeThreads, onHoldCapDate, unfreezeThreads } from "./lifecycle";
import { assertOfferFloor, tightenFloorPct } from "./offer-floor";
import { HOLD_MS, NOBLESVILLE_SQUARE, parseWorkLevel } from "./types";
import { needsWorkJson } from "./needs-work";
import { clampListingDeposit, listingTitleDeposit } from "./deposit";
import { getBoardLevers, getPlatformTitleDeposit } from "./settings";
import { PHOTO_NEW } from "./listing-photos";
import { parseOccupancy } from "./occupancy";

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

export { saveBuyBoxAction } from "./save-buy-box";

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

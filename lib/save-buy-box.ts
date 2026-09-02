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
import { HOLD_MS, NOBLESVILLE_SQUARE, parseWorkLevel, parseWorkLevels, type AlertMode } from "./types";
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

export async function saveBuyBoxAction(formData: FormData) {
  const user = await requireUser();
  const radiusMiles = Number(formData.get("radiusMiles"));
  const maxAssignmentPrice = Number(formData.get("maxAssignmentPrice"));
  const minBedsRaw = String(formData.get("minBeds") || "");
  const minSfRaw = String(formData.get("minSf") || "");
  const maxRehabRaw = String(formData.get("maxRehab") || "");
  const workLevels = parseWorkLevels(formData.getAll("workLevels"));
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
  const { resolveBuyBoxPin } = await import("./geo-pins");
  const pin = resolveBuyBoxPin({
    zip,
    centerLabel,
    fallback: existing
      ? { lat: existing.lat, lng: existing.lng, label: existing.centerLabel, zip: existing.zip }
      : NOBLESVILLE_SQUARE,
  });
  const chipCities = citiesIntersectingCircle({ lat: pin.lat, lng: pin.lng }, radiusMiles);
  const selectedCities = formData.getAll("cities").map(String);
  const excludedCities = JSON.stringify(
    mergeExcludedCities(parseExcludedCities(existing?.excludedCities), chipCities, selectedCities),
  );
  const data = {
    userId: user.id,
    centerLabel: pin.matched ? pin.label : centerLabel,
    zip: pin.matched ? pin.zip : zip,
    lat: pin.lat,
    lng: pin.lng,
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

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

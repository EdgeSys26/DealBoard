"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { refreshGradesForBox } from "./grade-listing";
import { NOBLESVILLE_SQUARE, parseWorkLevels, type AlertMode } from "./types";

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

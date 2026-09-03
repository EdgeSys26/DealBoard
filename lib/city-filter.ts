"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireUser } from "./auth";

export async function toggleCityFilterAction(formData: FormData) {
  const user = await requireUser();
  const city = String(formData.get("city") || "").trim();
  if (!city) return;
  const box = await prisma.buyBox.findFirst({ where: { userId: user.id } });
  if (!box) return;
  const { HOME_OFF_COOKIE, parseExcludedCities, pruneHomeOffCities, citiesIntersectingCircle } =
    await import("./area-cities");
  const buyBoxExcluded = parseExcludedCities(box.excludedCities);
  if (buyBoxExcluded.includes(city)) return;
  const chipCities = citiesIntersectingCircle({ lat: box.lat, lng: box.lng }, box.radiusMiles);
  const jar = await cookies();
  const off = parseExcludedCities(jar.get(HOME_OFF_COOKIE)?.value);
  const toggled = off.includes(city) ? off.filter((item) => item !== city) : [...off, city];
  const next = pruneHomeOffCities(toggled, chipCities, buyBoxExcluded);
  jar.set(HOME_OFF_COOKIE, JSON.stringify(next), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/home");
  if (String(formData.get("view") || "") === "all") {
    redirect("/home?view=all");
  }
}

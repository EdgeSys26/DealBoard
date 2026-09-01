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

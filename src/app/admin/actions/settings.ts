"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-helpers";
import { formString } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { STORE_SETTINGS_KEY } from "@/lib/store-settings";
import { storeContactSchema } from "@/lib/validators";

/** Saves the atelier address and contact details used across the storefront and emails. */
export async function saveStoreContactAction(formData: FormData) {
  await requireAdmin();

  const parsed = storeContactSchema.safeParse({
    supportEmail: formString(formData, "supportEmail"),
    ordersEmail: formString(formData, "ordersEmail"),
    supportPhone: formString(formData, "supportPhone"),
    addressLine: formString(formData, "addressLine"),
    addressLine2: formString(formData, "addressLine2"),
    city: formString(formData, "city"),
    postcode: formString(formData, "postcode"),
    country: formString(formData, "country"),
    countryCode: formString(formData, "countryCode"),
    hours: formString(formData, "hours"),
    instagram: formString(formData, "instagram"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the details and try again.";
    redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }

  const existing = await prisma.setting.findUnique({
    where: { key: STORE_SETTINGS_KEY },
    select: { value: true },
  });

  // Keep the other keys already stored under "store" (currency, dispatch cutoff…).
  const current =
    existing?.value && typeof existing.value === "object" && !Array.isArray(existing.value)
      ? (existing.value as Prisma.JsonObject)
      : {};
  const value = { ...current, ...parsed.data } as Prisma.InputJsonObject;

  await prisma.setting.upsert({
    where: { key: STORE_SETTINGS_KEY },
    create: { key: STORE_SETTINGS_KEY, value },
    update: { value },
  });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

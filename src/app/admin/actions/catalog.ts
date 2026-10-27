"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-helpers";
import { formBool, formIds, formInt, formOptional, formPence, formString } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

function toPence(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100)) : 0;
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();

  const productId = formString(formData, "productId");
  if (!productId) redirect("/admin/products?error=Missing%20product.");

  const name = formString(formData, "name");
  const description = formString(formData, "description");
  if (name.length < 2 || description.length < 20) {
    redirect(
      `/admin/products/${productId}?error=${encodeURIComponent("Name and a 20+ character description are required.")}`,
    );
  }

  const variantIds = formIds(formData, "variantId");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name,
          subtitle: formOptional(formData, "subtitle") ?? null,
          description,
          details: formOptional(formData, "details") ?? null,
          color: formString(formData, "color") || "Natural Black",
          isActive: formBool(formData, "isActive"),
          isFeatured: formBool(formData, "isFeatured"),
          isBestSeller: formBool(formData, "isBestSeller"),
          metaTitle: formOptional(formData, "metaTitle") ?? null,
          metaDescription: formOptional(formData, "metaDescription") ?? null,
        },
      });

      let lowestPrice = Number.POSITIVE_INFINITY;
      for (const variantId of variantIds) {
        const pricePence = toPence(formString(formData, `price-${variantId}`));
        const stock = Math.max(0, formInt(formData, `stock-${variantId}`, 0));
        const isActive = formBool(formData, `active-${variantId}`);
        const compareAt = toPence(formString(formData, `compare-${variantId}`));

        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            pricePence,
            stock,
            isActive,
            compareAtPricePence: compareAt > pricePence ? compareAt : null,
          },
        });

        if (isActive) lowestPrice = Math.min(lowestPrice, pricePence);
      }

      if (Number.isFinite(lowestPrice)) {
        await tx.product.update({
          where: { id: productId },
          data: { basePricePence: lowestPrice },
        });
      }
    });
  } catch (error) {
    redirect(
      `/admin/products/${productId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Update failed.")}`,
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  revalidatePath("/");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const name = formString(formData, "name");
  const description = formString(formData, "description");
  const categoryId = formString(formData, "categoryId");
  const texture = formString(formData, "texture");
  const pricePence = formPence(formData, "price");
  const stock = Math.max(0, formInt(formData, "stock", 0));

  if (name.length < 2 || description.length < 20 || !categoryId) {
    redirect(
      `/admin/products/new?error=${encodeURIComponent("Name, category and a 20+ character description are required.")}`,
    );
  }

  const baseSlug = slugify(formString(formData, "slug") || name) || `product-${Date.now()}`;
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const imageUrl = formOptional(formData, "imageUrl");
  const lengthInches = formInt(formData, "lengthInches", 0) || undefined;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      subtitle: formOptional(formData, "subtitle") ?? null,
      description,
      details: formOptional(formData, "details") ?? null,
      categoryId,
      texture: texture as never,
      color: formString(formData, "color") || "Natural Black",
      basePricePence: pricePence,
      compareAtPricePence: null,
      isActive: formBool(formData, "isActive"),
      isFeatured: formBool(formData, "isFeatured"),
      isBestSeller: false,
      tags: [],
      images: imageUrl
        ? { create: [{ url: imageUrl, alt: name, position: 0 }] }
        : {
            create: [
              {
                url: "/images/product-p1.jpg",
                alt: name,
                position: 0,
              },
            ],
          },
      variants: {
        create: [
          {
            sku: `LT-${slug.slice(0, 10).toUpperCase()}-${String(Date.now()).slice(-5)}`,
            label: lengthInches ? `${lengthInches}"` : "One size",
            lengthInches: lengthInches ?? null,
            color: formString(formData, "color") || "Natural Black",
            texture: texture as never,
            pricePence,
            stock,
            isActive: true,
          },
        ],
      },
    },
    select: { id: true },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}?created=1`);
}

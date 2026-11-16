"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-helpers";
import { formBool, formIds, formInt, formOptional, formPence, formString } from "@/lib/form";
import { normalizeAlt, parseImageList } from "@/lib/media/product-images";
import { applyProductImages } from "@/lib/media/product-images.server";
import { deleteImage } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/images/product-p1.jpg";

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

type ProductImageInput = { id?: string; url: string; alt?: string };

/**
 * Persists the whole gallery from the admin image manager.
 *
 * Returns a result object instead of redirecting so the client component can
 * show failures inline without losing the in-progress edit. Order becomes
 * `position`, and rows the admin removed are deleted from the store afterwards.
 */
export async function saveProductImagesAction(input: {
  productId: string;
  images: ProductImageInput[];
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const result = await applyProductImages(
    typeof input?.productId === "string" ? input.productId : "",
    Array.isArray(input?.images) ? input.images : [],
  );
  if (!result.ok) return result;

  await Promise.all(result.removed.map((image) => deleteImage(image.url)));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.productId}`);
  revalidatePath(`/product/${result.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { ok: true };
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

  const gallery = parseImageList(formString(formData, "imageUrls"));
  const legacyImageUrl = formOptional(formData, "imageUrl");
  const requested = gallery.length > 0 ? gallery : legacyImageUrl ? [{ url: legacyImageUrl }] : [];
  const images =
    requested.length > 0
      ? requested.map((image, position) => ({
          url: image.url,
          alt: normalizeAlt(image.alt, name),
          position,
        }))
      : [{ url: PLACEHOLDER_IMAGE, alt: name, position: 0 }];

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
      images: { create: images },
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

/**
 * Server-only helpers for the product gallery (imported by admin actions).
 *
 * Kept free of `next/cache` and the storage adapter so the database diffing can
 * be exercised directly by scripts; the calling action revalidates paths and
 * removes the orphaned files.
 */
import {
  MAX_PRODUCT_IMAGES,
  isAllowedImageUrl,
  planImageChanges,
} from "@/lib/media/product-images";
import { prisma } from "@/lib/prisma";

export type ProductImageInput = { id?: string; url: string; alt?: string };

export type ApplyProductImagesResult =
  | { ok: true; slug: string; removed: { id: string; url: string }[] }
  | { ok: false; error: string };

/**
 * Writes the submitted gallery to the database in a single transaction: new
 * rows are created, kept rows get their new position/alt, dropped rows are
 * deleted. The caller (a server action) owns auth, cache invalidation and
 * removing the orphaned files from the store.
 */
export async function applyProductImages(
  productId: string,
  images: ProductImageInput[],
): Promise<ApplyProductImagesResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true, images: { select: { id: true, url: true } } },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const desired = images.map((image) => ({
    id: typeof image?.id === "string" ? image.id : undefined,
    url: typeof image?.url === "string" ? image.url.trim() : "",
    alt: typeof image?.alt === "string" ? image.alt : undefined,
  }));

  if (desired.length > MAX_PRODUCT_IMAGES) {
    return { ok: false, error: `A product can have at most ${MAX_PRODUCT_IMAGES} images.` };
  }
  if (desired.some((image) => !image.url || !isAllowedImageUrl(image.url))) {
    return { ok: false, error: "Every image needs a valid URL (a /path or an https:// link)." };
  }

  const plan = planImageChanges(product.images, desired, product.name);
  const operations = [
    ...plan.update.map((image) =>
      prisma.productImage.update({
        where: { id: image.id },
        data: { alt: image.alt, position: image.position },
      }),
    ),
    ...plan.create.map((image) =>
      prisma.productImage.create({
        data: {
          productId: product.id,
          url: image.url,
          alt: image.alt,
          position: image.position,
        },
      }),
    ),
    ...(plan.remove.length > 0
      ? [
          prisma.productImage.deleteMany({
            where: { id: { in: plan.remove.map((image) => image.id) } },
          }),
        ]
      : []),
  ];

  try {
    if (operations.length > 0) await prisma.$transaction(operations);
  } catch (error) {
    console.error("[media] applyProductImages failed:", error);
    return { ok: false, error: "Could not save the gallery. Try again." };
  }

  return { ok: true, slug: product.slug, removed: plan.remove };
}

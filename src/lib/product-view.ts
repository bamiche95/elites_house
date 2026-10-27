import type { Prisma } from "@prisma/client";

import type { ProductCardData } from "@/components/product/product-card";

/** Shared include used by shop, category, home and related-product queries. */
export const productCardInclude = {
  images: { orderBy: { position: "asc" as const }, take: 2 },
  category: { select: { name: true, slug: true } },
  variants: { where: { isActive: true }, select: { stock: true, pricePence: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithCardData = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;

export function toProductCard(product: ProductWithCardData): ProductCardData {
  const prices = product.variants.map((variant) => variant.pricePence);
  const lowestPrice = prices.length ? Math.min(...prices) : product.basePricePence;

  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    categoryName: product.category.name,
    basePricePence: lowestPrice,
    compareAtPricePence: product.compareAtPricePence,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    isBestSeller: product.isBestSeller,
    isFeatured: product.isFeatured,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    inStock: product.variants.some((variant) => variant.stock > 0),
  };
}

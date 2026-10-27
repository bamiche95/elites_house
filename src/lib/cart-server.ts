import "server-only";

import { MAX_QTY_PER_LINE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type ResolvedCartLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  variantLabel: string;
  sku: string;
  imageUrl: string;
  unitPricePence: number;
  compareAtPricePence: number | null;
  quantity: number;
  stock: number;
  lineTotalPence: number;
};

export type CartResolution = {
  lines: ResolvedCartLine[];
  subtotalPence: number;
  itemCount: number;
  issues: string[];
  removedVariantIds: string[];
};

type CartInput = { variantId: string; quantity: number };

/**
 * Server-of-record cart resolution. The client only ever sends variant ids and
 * quantities — prices, stock and availability are always read from the database.
 */
export async function resolveCart(items: CartInput[]): Promise<CartResolution> {
  const requested = new Map<string, number>();
  for (const item of items) {
    if (!item?.variantId) continue;
    const quantity = Math.max(1, Math.min(Math.round(item.quantity) || 1, MAX_QTY_PER_LINE));
    requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + quantity);
  }

  const issues: string[] = [];
  const removedVariantIds: string[] = [];

  if (requested.size === 0) {
    return {
      lines: [],
      subtotalPence: 0,
      itemCount: 0,
      issues: ["Your bag is empty."],
      removedVariantIds,
    };
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: [...requested.keys()] } },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
  });

  const lines: ResolvedCartLine[] = [];

  for (const [variantId, quantity] of requested) {
    const variant = variants.find((candidate) => candidate.id === variantId);

    if (!variant || !variant.isActive || !variant.product.isActive) {
      removedVariantIds.push(variantId);
      issues.push("An item in your bag is no longer available and was removed.");
      continue;
    }

    if (variant.stock <= 0) {
      removedVariantIds.push(variantId);
      issues.push(`${variant.product.name} (${variant.label}) just sold out.`);
      continue;
    }

    let resolvedQuantity = quantity;
    if (quantity > variant.stock) {
      resolvedQuantity = Math.min(variant.stock, MAX_QTY_PER_LINE);
      issues.push(
        `Only ${variant.stock} of ${variant.product.name} (${variant.label}) remain — quantity adjusted.`,
      );
    }

    lines.push({
      variantId: variant.id,
      productId: variant.productId,
      productSlug: variant.product.slug,
      name: variant.product.name,
      variantLabel: variant.label,
      sku: variant.sku,
      imageUrl: variant.product.images[0]?.url ?? "/images/product-p1.jpg",
      unitPricePence: variant.pricePence,
      compareAtPricePence: variant.compareAtPricePence,
      quantity: resolvedQuantity,
      stock: variant.stock,
      lineTotalPence: variant.pricePence * resolvedQuantity,
    });
  }

  const subtotalPence = lines.reduce((total, line) => total + line.lineTotalPence, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  return { lines, subtotalPence, itemCount, issues, removedVariantIds };
}

export type OrderTotals = {
  subtotalPence: number;
  shippingPence: number;
  discountPence: number;
  totalPence: number;
};

/** Pure totals maths shared by the checkout UI, API routes and the database. */
export function calculateTotals(
  subtotalPence: number,
  shippingPence: number,
  discountPence = 0,
): OrderTotals {
  const safeDiscount = Math.min(Math.max(discountPence, 0), subtotalPence);
  const totalPence = Math.max(0, subtotalPence - safeDiscount + shippingPence);
  return {
    subtotalPence,
    shippingPence,
    discountPence: safeDiscount,
    totalPence,
  };
}

import "server-only";

import { randomBytes } from "node:crypto";

import type { Order, OrderItem, Prisma } from "@prisma/client";

import { calculateTotals, resolveCart } from "@/lib/cart-server";
import { shippingCostFor } from "@/lib/constants";
import { validateCoupon } from "@/lib/coupons";
import { notifyOrderStatus } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validators";

export class OrderError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.code = code;
    this.status = status;
  }
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderNumber() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  let suffix = "";
  for (const byte of randomBytes(5)) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }
  return `LT-${year}${month}-${suffix}`;
}

/**
 * Guests get a real User row (no password) so their order lives in the same
 * place as registered customers'. A password is set later via a one-time link.
 */
export async function ensureBuyerUser(email: string, name: string, phone?: string) {
  const normalized = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: name.trim() || null,
        phone: phone?.trim() || null,
        passwordHash: null,
        role: "CUSTOMER",
      },
      select: { id: true },
    });
    return created.id;
  } catch {
    // Concurrent sign-ups for the same email — read the winner.
    const found = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (found) return found.id;
    throw new OrderError(
      "BUYER_CREATE_FAILED",
      "We couldn't start your order. Please try again.",
      500,
    );
  }
}

export type CreateOrderResult = {
  order: Order & { items: OrderItem[] };
  lines: Awaited<ReturnType<typeof resolveCart>>["lines"];
  totals: {
    subtotalPence: number;
    shippingPence: number;
    discountPence: number;
    totalPence: number;
  };
  couponMessage?: string;
};

export type CreateOrderOptions = {
  input: CheckoutInput;
  userId?: string | null;
  provider?: "STRIPE" | "PAYPAL" | "DEMO";
};

export async function createOrder({
  input,
  userId,
  provider,
}: CreateOrderOptions): Promise<CreateOrderResult> {
  const resolution = await resolveCart(input.items);
  if (resolution.lines.length === 0) {
    throw new OrderError(
      "EMPTY_CART",
      "Your bag is empty or the items are no longer available.",
      400,
    );
  }

  const coupon = input.couponCode?.trim()
    ? await validateCoupon(input.couponCode, resolution.subtotalPence)
    : null;

  const discountPence = coupon?.ok ? coupon.discountPence : 0;
  const shippingPence = shippingCostFor(input.shippingMethod, resolution.subtotalPence);
  const totals = calculateTotals(resolution.subtotalPence, shippingPence, discountPence);

  const buyerId = userId ?? (await ensureBuyerUser(input.email, input.name, input.phone));
  const shippingAddress = input.shippingAddress as unknown as Prisma.InputJsonValue;
  const billingAddress = (input.billingSameAsShipping
    ? input.shippingAddress
    : input.billingAddress ?? input.shippingAddress) as unknown as Prisma.InputJsonValue;

  const order = await prisma.$transaction(
    async (tx) => {
      // Optimistic reservation — the WHERE clause guarantees we never oversell.
      for (const line of resolution.lines) {
        const reserved = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (reserved.count === 0) {
          throw new OrderError(
            "OUT_OF_STOCK",
            `${line.name} (${line.variantLabel}) just sold out. Please update your bag and try again.`,
            409,
          );
        }
      }

      if (coupon?.ok) {
        await tx.coupon.update({
          where: { id: coupon.coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: buyerId,
          status: provider ? "AWAITING_PAYMENT" : "PENDING",
          paymentStatus: "UNPAID",
          paymentProvider: provider ?? null,
          currency: "GBP",
          subtotalPence: totals.subtotalPence,
          shippingPence: totals.shippingPence,
          discountPence: totals.discountPence,
          taxPence: 0,
          totalPence: totals.totalPence,
          couponCode: coupon?.ok ? coupon.coupon.code : null,
          couponId: coupon?.ok ? coupon.coupon.id : null,
          shippingMethod: input.shippingMethod,
          shippingAddress,
          billingAddress,
          customerName: input.name.trim(),
          customerEmail: input.email.toLowerCase().trim(),
          customerPhone: input.phone.trim(),
          notes: input.notes?.trim() || null,
          items: {
            create: resolution.lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              name: line.name,
              variantLabel: line.variantLabel,
              sku: line.sku,
              imageUrl: line.imageUrl,
              unitPricePence: line.unitPricePence,
              quantity: line.quantity,
              lineTotalPence: line.lineTotalPence,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          type: "ORDER_CREATED",
          message: `${resolution.lines.length} item(s) reserved — ${formatMoney(totals.totalPence)} total.`,
          actor: "CUSTOMER",
        },
      });

      return created;
    },
    { timeout: 20_000, maxWait: 10_000 },
  );

  return {
    order,
    lines: resolution.lines,
    totals,
    couponMessage: coupon?.ok ? coupon.message : undefined,
  };
}

export type UpdateOrderStatusOptions = {
  orderId: string;
  status: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  note?: string;
  actor?: string;
  notify?: boolean;
};

export async function updateOrderStatus({
  orderId,
  status,
  trackingNumber,
  trackingCarrier,
  note,
  actor = "ADMIN",
  notify = true,
}: UpdateOrderStatusOptions) {
  if (status === "CANCELLED") {
    return cancelOrder({
      orderId,
      reason: note || "Cancelled by the atelier.",
      actor,
      notify,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId } });
    if (!current) throw new OrderError("NOT_FOUND", "Order not found.", 404);

    const data: Prisma.OrderUpdateInput = { status: status as Order["status"] };

    if (status === "PAID") {
      data.paymentStatus = "PAID";
      data.paidAt = current.paidAt ?? new Date();
    }
    if (status === "REFUNDED") {
      data.paymentStatus = "REFUNDED";
    }
    if (status === "DISPATCHED") {
      data.dispatchedAt = new Date();
      if (trackingNumber) data.trackingNumber = trackingNumber.trim();
      if (trackingCarrier) data.trackingCarrier = trackingCarrier.trim();
    }
    if (status === "COMPLETED") {
      data.completedAt = new Date();
    }

    const order = await tx.order.update({ where: { id: orderId }, data });

    await tx.orderEvent.create({
      data: {
        orderId,
        type: `STATUS_${status}`,
        message:
          note?.trim() ||
          `Status updated from ${current.status.replace(/_/g, " ").toLowerCase()} to ${status
            .replace(/_/g, " ")
            .toLowerCase()}.`,
        actor,
      },
    });

    return order;
  });

  if (notify) {
    await notifyOrderStatus(updated.id, status, note);
  }

  return updated;
}

export type CancelOrderOptions = {
  orderId: string;
  reason: string;
  actor?: string;
  notify?: boolean;
};

export async function cancelOrder({
  orderId,
  reason,
  actor = "SYSTEM",
  notify = true,
}: CancelOrderOptions) {
  const cancelled = await prisma.$transaction(
    async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!current) throw new OrderError("NOT_FOUND", "Order not found.", 404);
      if (current.status === "CANCELLED") return current;

      if (!current.stockReleased) {
        for (const item of current.items) {
          if (!item.variantId) continue;
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason,
          stockReleased: true,
        },
        include: { items: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          type: "ORDER_CANCELLED",
          message: reason,
          actor,
        },
      });

      return order;
    },
    { timeout: 20_000, maxWait: 10_000 },
  );

  if (notify) {
    await notifyOrderStatus(cancelled.id, "CANCELLED", reason);
  }

  return cancelled;
}

/**
 * Releases stock for abandoned payment intents. Called by /api/cron/expire-orders.
 */
export async function expireStaleOrders(hours = 2, limit = 100) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const stale = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      paymentStatus: "UNPAID",
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: limit,
  });

  for (const order of stale) {
    await cancelOrder({
      orderId: order.id,
      reason: `Payment not completed within ${hours} hours — stock automatically released.`,
      actor: "CRON",
      notify: false,
    }).catch((error) => console.error("[cron] failed to expire order", order.id, error));
  }

  return stale.length;
}


import "server-only";

import type { Coupon } from "@prisma/client";

import { formatMoney } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export type CouponResult =
  | {
      ok: true;
      coupon: Pick<Coupon, "id" | "code" | "type" | "value" | "description">;
      discountPence: number;
      message: string;
    }
  | { ok: false; error: string };

export function calculateCouponDiscount(
  coupon: Pick<Coupon, "type" | "value">,
  subtotalPence: number,
) {
  if (coupon.type === "PERCENT") {
    const percent = Math.min(Math.max(coupon.value, 0), 100);
    return Math.round((subtotalPence * percent) / 100);
  }
  return Math.min(coupon.value, subtotalPence);
}

/** Validates a discount code against the live database state. */
export async function validateCoupon(
  rawCode: string | undefined | null,
  subtotalPence: number,
): Promise<CouponResult> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a discount code." };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "That code isn't valid. Please check and try again." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, error: "That code isn't active yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, error: "That code has expired." };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "That code has reached its usage limit." };
  }
  if (subtotalPence < coupon.minSpendPence) {
    return {
      ok: false,
      error: `Spend ${formatMoney(coupon.minSpendPence)} or more to use ${coupon.code}.`,
    };
  }

  const discountPence = calculateCouponDiscount(coupon, subtotalPence);
  if (discountPence <= 0) {
    return { ok: false, error: "That code can't be applied to this order." };
  }

  return {
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
    },
    discountPence,
    message:
      coupon.type === "PERCENT"
        ? `${coupon.code} applied — ${coupon.value}% off.`
        : `${coupon.code} applied — ${formatMoney(discountPence)} off.`,
  };
}

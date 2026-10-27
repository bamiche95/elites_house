import "server-only";

import type { PaymentProvider, Prisma } from "@prisma/client";

import { notifyOrderConfirmation } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export type MarkPaidInput = {
  orderId: string;
  provider: PaymentProvider;
  providerRef: string;
  amountPence: number;
  raw?: Prisma.InputJsonValue;
};

/**
 * Idempotent fulfilment: the unique PaymentTransaction.providerRef guarantees a
 * payment can only ever be applied to an order once, even if webhooks retry.
 */
export async function markOrderPaid({
  orderId,
  provider,
  providerRef,
  amountPence,
  raw,
}: MarkPaidInput): Promise<{ alreadyProcessed: boolean }> {
  let alreadyProcessed = false;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { id: true, paymentStatus: true, totalPence: true },
        });
        if (!order) throw new Error("ORDER_NOT_FOUND");
        if (order.paymentStatus === "PAID") return "already" as const;

        await tx.paymentTransaction.create({
          data: {
            orderId,
            provider,
            providerRef,
            amountPence,
            status: "PAID",
            raw,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PROCESSING",
            paymentStatus: "PAID",
            paymentProvider: provider,
            paidAt: new Date(),
          },
        });

        await tx.orderEvent.create({
          data: {
            orderId,
            type: "PAYMENT_CAPTURED",
            message: `Payment of ${formatMoney(amountPence)} captured via ${provider}.`,
            actor: "SYSTEM",
          },
        });

        return "processed" as const;
      },
      { timeout: 20_000, maxWait: 10_000 },
    );

    alreadyProcessed = result === "already";
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { alreadyProcessed: true };
    }
    throw error;
  }

  if (!alreadyProcessed) {
    await notifyOrderConfirmation(orderId);
  }

  return { alreadyProcessed };
}

export async function markPaymentFailed(orderId: string, reason: string, provider?: PaymentProvider) {
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        type: "PAYMENT_FAILED",
        message: `${provider ?? "Payment"} failed: ${reason}`,
        actor: "SYSTEM",
      },
    });
  });
}

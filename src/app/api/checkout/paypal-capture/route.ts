import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { capturePayPalOrder } from "@/lib/payments/paypal";
import { markOrderPaid } from "@/lib/payments/fulfilment";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(`paypal-capture:${clientIp(request)}`, 12, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { orderNumber?: string; paypalOrderId?: string }
    | null;

  if (!body?.orderNumber || !body.paypalOrderId) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: body.orderNumber },
    select: {
      id: true,
      orderNumber: true,
      totalPence: true,
      paymentStatus: true,
      paymentProvider: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ orderNumber: order.orderNumber, alreadyPaid: true });
  }

  try {
    const capture = await capturePayPalOrder(body.paypalOrderId);

    if (capture.referenceId && capture.referenceId !== order.orderNumber) {
      return NextResponse.json({ error: "Payment mismatch." }, { status: 409 });
    }
    if (capture.amountPence < order.totalPence) {
      return NextResponse.json({ error: "Payment amount mismatch." }, { status: 409 });
    }

    await markOrderPaid({
      orderId: order.id,
      provider: "PAYPAL",
      providerRef: capture.captureId,
      amountPence: capture.amountPence,
      raw: capture.raw as Prisma.InputJsonValue,
    });

    return NextResponse.json({ orderNumber: order.orderNumber });
  } catch (error) {
    console.error("[paypal-capture]", error);
    return NextResponse.json(
      { error: "We couldn't confirm your PayPal payment. Please contact us if you were charged." },
      { status: 502 },
    );
  }
}

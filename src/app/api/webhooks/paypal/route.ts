import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { markOrderPaid } from "@/lib/payments/fulfilment";
import { verifyPayPalWebhook } from "@/lib/payments/paypal";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    status?: string;
  };
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as PayPalEvent | null;
  if (!payload?.id || !payload.event_type) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const verified = await verifyPayPalWebhook(
    {
      transmissionId: request.headers.get("paypal-transmission-id") ?? "",
      transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
      certUrl: request.headers.get("paypal-cert-url") ?? "",
      authAlgo: request.headers.get("paypal-auth-algo") ?? "",
      transmissionSig: request.headers.get("paypal-transmission-sig") ?? "",
    },
    payload,
  );

  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "PAYPAL",
        eventId: payload.id,
        type: payload.event_type,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  try {
    if (payload.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderNumber = payload.resource?.custom_id;
      const captureId = payload.resource?.id;
      const amount = Number(payload.resource?.amount?.value ?? 0);

      if (orderNumber && captureId) {
        const order = await prisma.order.findUnique({
          where: { orderNumber },
          select: { id: true },
        });
        if (order) {
          await markOrderPaid({
            orderId: order.id,
            provider: "PAYPAL",
            providerRef: captureId,
            amountPence: Math.round(amount * 100),
            raw: payload as unknown as Prisma.InputJsonValue,
          });
        }
      }
    }

    await prisma.webhookEvent.update({
      where: { eventId: payload.id },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[paypal-webhook] processing failed", message);
    await prisma.webhookEvent
      .update({ where: { eventId: payload.id }, data: { error: message } })
      .catch(() => undefined);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}

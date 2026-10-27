import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { markOrderPaid, markPaymentFailed } from "@/lib/payments/fulfilment";
import { getStripe } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "STRIPE",
        eventId: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[stripe-webhook] could not record event", error);
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await markOrderPaid({
            orderId,
            provider: "STRIPE",
            providerRef: intent.id,
            amountPence: intent.amount_received || intent.amount,
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await markPaymentFailed(
            orderId,
            intent.last_payment_error?.message ?? "Card declined",
            "STRIPE",
          );
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const intentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (intentId) {
          const transaction = await prisma.paymentTransaction.findUnique({
            where: { providerRef: intentId },
          });
          if (transaction) {
            await prisma.$transaction([
              prisma.order.update({
                where: { id: transaction.orderId },
                data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
              }),
              prisma.orderEvent.create({
                data: {
                  orderId: transaction.orderId,
                  type: "PAYMENT_REFUNDED",
                  message: "Refund confirmed by Stripe.",
                  actor: "SYSTEM",
                },
              }),
            ]);
          }
        }
        break;
      }
      default:
        break;
    }

    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[stripe-webhook] processing failed", message);
    await prisma.webhookEvent
      .update({ where: { eventId: event.id }, data: { error: message } })
      .catch(() => undefined);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}

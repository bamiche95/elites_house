import { NextResponse } from "next/server";

import { markOrderPaid } from "@/lib/payments/fulfilment";
import { getStripe } from "@/lib/payments/stripe";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(`stripe-confirm:${clientIp(request)}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { paymentIntentId?: string }
    | null;
  if (!body?.paymentIntentId) {
    return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is unavailable." }, { status: 503 });
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
    const orderId = intent.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Payment not linked to an order." }, { status: 400 });
    }
    if (intent.status !== "succeeded") {
      return NextResponse.json({ status: intent.status }, { status: 202 });
    }

    await markOrderPaid({
      orderId,
      provider: "STRIPE",
      providerRef: intent.id,
      amountPence: intent.amount_received || intent.amount,
    });

    return NextResponse.json({ status: "paid" });
  } catch (error) {
    console.error("[stripe-confirm]", error);
    return NextResponse.json({ error: "We couldn't verify that payment." }, { status: 502 });
  }
}

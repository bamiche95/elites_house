import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-helpers";
import { allowDemoPayments, env, isPayPalConfigured, isStripeConfigured } from "@/lib/env";
import { createOrder, OrderError } from "@/lib/orders";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { getStripe } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Provider = "STRIPE" | "PAYPAL" | "DEMO";

export async function POST(request: Request) {
  const limit = rateLimit(`checkout-start:${clientIp(request)}`, 12, 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { provider?: Provider; checkout?: unknown }
    | null;
  if (!body?.checkout) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }

  const provider: Provider =
    body.provider === "PAYPAL" || body.provider === "DEMO" || body.provider === "STRIPE"
      ? body.provider
      : "STRIPE";

  if (provider === "STRIPE" && !isStripeConfigured) {
    return NextResponse.json({ error: "Card payments are unavailable." }, { status: 503 });
  }
  if (provider === "PAYPAL" && !isPayPalConfigured) {
    return NextResponse.json({ error: "PayPal is unavailable." }, { status: 503 });
  }
  if (provider === "DEMO" && !allowDemoPayments) {
    return NextResponse.json({ error: "Test payments are disabled." }, { status: 403 });
  }

  const parsed = checkoutSchema.safeParse(body.checkout);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please check your details.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  const user = await getSessionUser();
  const siteUrl = (env.siteUrl || new URL(request.url).origin).replace(/\/$/, "");

  try {
    const { order } = await createOrder({
      input: parsed.data,
      userId: user?.id ?? null,
      provider,
    });

    if (provider === "DEMO") {
      return NextResponse.json({
        mode: "demo",
        orderNumber: order.orderNumber,
        orderId: order.id,
      });
    }

    if (provider === "PAYPAL") {
      const paypal = await createPayPalOrder({
        amountPence: order.totalPence,
        reference: order.orderNumber,
        description: `LushTresses order ${order.orderNumber}`,
        returnUrl: `${siteUrl}/checkout/success?order=${order.orderNumber}`,
        cancelUrl: `${siteUrl}/checkout?cancelled=1`,
      });

      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "PAYPAL_ORDER_CREATED",
          message: `PayPal order ${paypal.id} created.`,
        },
      });

      return NextResponse.json({
        mode: "paypal",
        orderNumber: order.orderNumber,
        orderId: order.id,
        paypalOrderId: paypal.id,
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Card payments are unavailable." }, { status: 503 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: order.totalPence,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
      },
      receipt_email: order.customerEmail,
      description: `LushTresses order ${order.orderNumber}`,
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_INTENT_CREATED",
        message: `Stripe payment intent ${intent.id} created.`,
      },
    });

    return NextResponse.json({
      mode: "stripe",
      orderNumber: order.orderNumber,
      orderId: order.id,
      clientSecret: intent.client_secret,
      publishableKey: env.stripePublishableKey,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("[checkout/start]", error);
    return NextResponse.json(
      { error: "We couldn't start your payment. Please try again." },
      { status: 500 },
    );
  }
}

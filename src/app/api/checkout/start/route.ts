import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getSessionUser } from "@/lib/auth-helpers";
import { allowDemoPayments, env, isPayPalConfigured, isStripeConfigured } from "@/lib/env";
import { createOrder, OrderError } from "@/lib/orders";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { isStripeMethodAvailable } from "@/lib/payments/stripe-method-config";
import {
  isStripePaymentMethodId,
  stripePaymentMethodLabel,
  type StripePaymentMethodId,
} from "@/lib/payments/stripe-methods";
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
    | { provider?: Provider; stripeMethod?: unknown; checkout?: unknown }
    | null;
  if (!body?.checkout) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }

  const provider: Provider =
    body.provider === "PAYPAL" || body.provider === "DEMO" || body.provider === "STRIPE"
      ? body.provider
      : "STRIPE";

  let stripeMethod: StripePaymentMethodId = "card";
  if (provider === "STRIPE" && body.stripeMethod != null) {
    if (!isStripePaymentMethodId(body.stripeMethod)) {
      return NextResponse.json(
        { error: "Choose a valid payment method." },
        { status: 422 },
      );
    }
    stripeMethod = body.stripeMethod;
  }

  if (provider === "STRIPE" && !isStripeConfigured) {
    return NextResponse.json({ error: "Stripe payments are unavailable." }, { status: 503 });
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

  if (provider === "STRIPE" && !(await isStripeMethodAvailable(stripeMethod))) {
    return NextResponse.json(
      {
        error:
          "That payment method is unavailable right now. Please choose another method.",
      },
      { status: 503 },
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
        description: `The Elites House order ${order.orderNumber}`,
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
      return NextResponse.json({ error: "Stripe payments are unavailable." }, { status: 503 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: order.totalPence,
      currency: "gbp",
      allowed_payment_method_types: [stripeMethod],
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        stripePaymentMethod: stripeMethod,
      },
      receipt_email: order.customerEmail,
      description: `The Elites House order ${order.orderNumber}`,
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_INTENT_CREATED",
        message: `Stripe payment intent ${intent.id} created for ${stripePaymentMethodLabel(
          stripeMethod,
        )}.`,
      },
    });

    return NextResponse.json({
      mode: "stripe",
      orderNumber: order.orderNumber,
      orderId: order.id,
      clientSecret: intent.client_secret,
      publishableKey: env.stripePublishableKey,
      stripeMethod,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      const methodRejected =
        (error.param ?? "").includes("allowed_payment_method_types") ||
        /payment method type|payment method.*(?:invalid|not activated|unavailable|unsupported)/i.test(
          error.message,
        );
      if (methodRejected) {
        console.warn(
          `[checkout/start] Stripe rejected the ${stripeMethod} payment method:`,
          error.message,
        );
        return NextResponse.json(
          {
            error:
              "That payment method is unavailable right now. Please choose another method.",
          },
          { status: 503 },
        );
      }
    }
    console.error("[checkout/start]", error);
    return NextResponse.json(
      { error: "We couldn't start your payment. Please try again." },
      { status: 500 },
    );
  }
}

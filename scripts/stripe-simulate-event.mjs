#!/usr/bin/env node
/**
 * Simulate a Stripe card payment and its webhook — no Stripe CLI required.
 *
 *   node scripts/stripe-simulate-event.mjs <orderNumber> [succeeded|failed]
 *
 * 1. Finds the PaymentIntent that `POST /api/checkout/start` created for the order.
 * 2. Confirms it with a Stripe *test* payment method (`pm_card_visa`, or
 *    `pm_card_chargeDeclined` for the failure scenario).
 * 3. Signs a `payment_intent.succeeded` / `payment_intent.payment_failed` event with
 *    `STRIPE_WEBHOOK_SECRET` and posts it to `/api/webhooks/stripe`, exactly the way
 *    Stripe does — so signature verification, `markOrderPaid()` and the idempotency
 *    guard are all exercised.
 *
 * Requirements: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env` (any
 * `whsec_…` string works locally). Test mode only — live intents are refused.
 */
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const Stripe = require("stripe");
const { PrismaClient } = require("@prisma/client");

const envFile = ".env";
if (existsSync(envFile) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envFile);
}

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const [, , orderNumber, requestedOutcome = "succeeded"] = process.argv;
const outcome = requestedOutcome === "failed" ? "failed" : "succeeded";

if (!orderNumber) {
  console.error("Usage: node scripts/stripe-simulate-event.mjs <orderNumber> [succeeded|failed]");
  process.exit(1);
}
if (!secretKey || !webhookSecret) {
  console.error(
    "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env first. Locally any\n" +
      'whsec_… value works, e.g. STRIPE_WEBHOOK_SECRET="whsec_local_dev".',
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey, { appInfo: { name: "The Elites House", version: "1.0.0" } });
const prisma = new PrismaClient();

try {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true },
  });
  if (!order) {
    throw new Error(`No order ${orderNumber}. Start one through /checkout first.`);
  }

  const intents = await stripe.paymentIntents.list({ limit: 100 });
  const intent = intents.data.find((candidate) => candidate.metadata?.orderId === order.id);
  if (!intent) {
    throw new Error(`No Stripe PaymentIntent linked to ${order.orderNumber}.`);
  }
  if (intent.livemode) {
    throw new Error("Refusing to simulate a live PaymentIntent. This script is test-mode only.");
  }

  const returnUrl = `${siteUrl}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
  let confirmed = intent;

  if (intent.status === "requires_payment_method" || intent.status === "requires_confirmation") {
    const paymentMethod = outcome === "failed" ? "pm_card_chargeDeclined" : "pm_card_visa";
    try {
      confirmed = await stripe.paymentIntents.confirm(intent.id, {
        payment_method: paymentMethod,
        return_url: returnUrl,
      });
    } catch (error) {
      if (outcome !== "failed") throw error;
      // Declines surface as an error; the intent itself carries the failure details.
      confirmed = await stripe.paymentIntents.retrieve(intent.id);
      console.log(`Decline raised as expected: ${error.message}`);
    }
  }

  const type =
    outcome === "failed" ? "payment_intent.payment_failed" : "payment_intent.succeeded";
  const event = {
    id: `evt_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
    object: "event",
    api_version: "2025-03-31.basil",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type,
    data: { object: confirmed },
  };

  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  const response = await fetch(`${siteUrl}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body: payload,
  });

  console.log(`order      ${order.orderNumber} (was ${order.status}/${order.paymentStatus})`);
  console.log(`intent     ${confirmed.id} -> ${confirmed.status}`);
  console.log(`event      ${type} (${event.id})`);
  console.log(`webhook    ${response.status} ${await response.text()}`);

  const after = await prisma.order.findUnique({
    where: { id: order.id },
    select: { status: true, paymentStatus: true, paidAt: true },
  });
  console.log(
    `order now  ${after.status}/${after.paymentStatus}${after.paidAt ? " (paidAt set)" : ""}`,
  );
  process.exitCode = response.ok ? 0 : 1;
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

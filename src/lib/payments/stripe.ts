import "server-only";

import Stripe from "stripe";

import { env, isStripeConfigured } from "@/lib/env";

let stripeClient: Stripe | null = null;

/** Lazily constructed so builds and pages work without Stripe keys. */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      appInfo: { name: "LushTresses", version: "1.0.0" },
      typescript: true,
    });
  }
  return stripeClient;
}

export function getStripePublishableKey() {
  return env.stripePublishableKey;
}

/** Stripe amounts are in minor units, exactly like our database. */
export function toStripeAmount(pence: number) {
  return Math.max(0, Math.round(pence));
}

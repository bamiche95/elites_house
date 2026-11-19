import "server-only";

import { unstable_cache } from "next/cache";
import type Stripe from "stripe";

import { getStripe } from "@/lib/payments/stripe";
import {
  STRIPE_PAYMENT_METHOD_IDS_LIST,
  type StripePaymentMethodId,
} from "@/lib/payments/stripe-methods";

export type StripeMethodAvailability = {
  methods: StripePaymentMethodId[];
};

const CACHE_SECONDS = process.env.NODE_ENV === "production" ? 300 : 10;

function pickDefaultConfiguration(
  configurations: Stripe.PaymentMethodConfiguration[],
): Stripe.PaymentMethodConfiguration | null {
  return (
    configurations.find((configuration) => configuration.is_default && !configuration.parent) ??
    configurations.find((configuration) => configuration.is_default) ??
    configurations.find((configuration) => configuration.active) ??
    null
  );
}

const loadStripeMethodAvailability = unstable_cache(
  async (): Promise<StripeMethodAvailability> => {
    const stripe = getStripe();
    if (!stripe) {
      return { methods: [] };
    }

    const configurations = await stripe.paymentMethodConfigurations.list({ limit: 100 });
    const configuration = pickDefaultConfiguration(configurations.data);
    if (!configuration) {
      return { methods: [] };
    }

    return {
      // `available` is true only when the method is toggled on in the
      // Dashboard and its capability is active.
      methods: STRIPE_PAYMENT_METHOD_IDS_LIST.filter(
        (methodId) => configuration[methodId]?.available === true,
      ),
    };
  },
  ["stripe-payment-method-configuration"],
  { revalidate: CACHE_SECONDS, tags: ["stripe-payment-methods"] },
);

/**
 * Reads the default Payment Method Configuration (root default when present)
 * and returns only the methods this checkout supports that are switched on.
 *
 * Fail-open: if Stripe is temporarily unavailable, all supported methods are
 * returned and the PaymentIntent request remains the source of truth.
 */
export async function getStripeMethodAvailability(): Promise<StripeMethodAvailability> {
  try {
    return await loadStripeMethodAvailability();
  } catch (error) {
    console.warn(
      "[payments/stripe-method-config] Could not read the Stripe payment method configuration:",
      error instanceof Error ? error.message : error,
    );
    return { methods: [...STRIPE_PAYMENT_METHOD_IDS_LIST] };
  }
}

export async function isStripeMethodAvailable(method: StripePaymentMethodId): Promise<boolean> {
  const { methods } = await getStripeMethodAvailability();
  return methods.includes(method);
}

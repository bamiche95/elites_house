/**
 * The Stripe payment methods surfaced as their own checkout tiles.
 *
 * Keep this module client-safe: it is imported by the checkout UI. The server
 * decides which of these are actually enabled by reading the Stripe default
 * Payment Method Configuration in `stripe-method-config.ts`.
 */
export const STRIPE_PAYMENT_METHOD_OPTIONS = [
  {
    id: "card",
    label: "Card",
    description: "Visa, Mastercard, Amex, Apple Pay & Google Pay",
  },
  {
    id: "klarna",
    label: "Klarna",
    description: "Pay in 3 interest-free instalments",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay with your PayPal balance or linked account",
  },
  {
    id: "revolut_pay",
    label: "Revolut Pay",
    description: "One-tap checkout with Revolut",
  },
  {
    id: "amazon_pay",
    label: "Amazon Pay",
    description: "Use the address and cards in your Amazon account",
  },
  {
    id: "pay_by_bank",
    label: "Pay by Bank",
    description: "Instant bank transfer via open banking",
  },
] as const;

export type StripePaymentMethodOption = (typeof STRIPE_PAYMENT_METHOD_OPTIONS)[number];
export type StripePaymentMethodId = StripePaymentMethodOption["id"];

const STRIPE_PAYMENT_METHOD_IDS = new Set<string>(
  STRIPE_PAYMENT_METHOD_OPTIONS.map((option) => option.id),
);

export const STRIPE_PAYMENT_METHOD_IDS_LIST: readonly StripePaymentMethodId[] =
  STRIPE_PAYMENT_METHOD_OPTIONS.map((option) => option.id);

export function isStripePaymentMethodId(value: unknown): value is StripePaymentMethodId {
  return typeof value === "string" && STRIPE_PAYMENT_METHOD_IDS.has(value);
}

export function stripePaymentMethodLabel(id: StripePaymentMethodId): string {
  return STRIPE_PAYMENT_METHOD_OPTIONS.find((option) => option.id === id)?.label ?? "Card";
}

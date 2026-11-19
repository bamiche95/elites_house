"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

import { PaymentMethodBrand } from "@/components/checkout/payment-method-brand";
import { Button } from "@/components/ui/button";
import {
  stripePaymentMethodLabel,
  type StripePaymentMethodId,
} from "@/lib/payments/stripe-methods";

export function StripePaymentForm({
  publishableKey,
  clientSecret,
  orderNumber,
  stripeMethod,
  onPaid,
}: {
  publishableKey: string;
  clientSecret: string;
  orderNumber: string;
  stripeMethod: StripePaymentMethodId;
  onPaid: () => void;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#17110e",
          colorBackground: "#fbf7f1",
          colorText: "#2a1f18",
          colorDanger: "#a13a35",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          borderRadius: "0px",
          spacingUnit: "4px",
        },
      },
    }),
    [clientSecret],
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeFormInner
        orderNumber={orderNumber}
        stripeMethod={stripeMethod}
        onPaid={onPaid}
      />
    </Elements>
  );
}

function StripeFormInner({
  orderNumber,
  stripeMethod,
  onPaid,
}: {
  orderNumber: string;
  stripeMethod: StripePaymentMethodId;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const methodLabel = stripePaymentMethodLabel(stripeMethod);
  const isCard = stripeMethod === "card";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your payment details.");
      setSubmitting(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${encodeURIComponent(orderNumber)}`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Your payment could not be completed.");
      setSubmitting(false);
      return;
    }

    if (
      result.paymentIntent?.status === "succeeded" ||
      result.paymentIntent?.status === "processing"
    ) {
      onPaid();
      return;
    }

    setError("Your payment is still processing — check your email for confirmation.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-4 border border-line bg-cream px-4 py-3">
        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
          Paying with
        </span>
        <span className="flex min-w-0 items-center gap-2.5">
          <PaymentMethodBrand method={stripeMethod} logoClassName="h-3.5" />
          <span className="sr-only text-sm text-espresso sm:not-sr-only sm:inline">
            {methodLabel}
          </span>
        </span>
      </div>
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        {submitting ? "Processing…" : isCard ? "Pay securely" : `Continue with ${methodLabel}`}
      </Button>
      <p className="text-center text-[0.65rem] leading-relaxed text-mocha">
        {isCard
          ? "Payments are encrypted and processed by Stripe. Apple Pay and Google Pay appear automatically on supported devices."
          : `You'll continue securely with ${methodLabel} to complete your payment. Payments are encrypted and processed by Stripe.`}
      </p>
    </form>
  );
}

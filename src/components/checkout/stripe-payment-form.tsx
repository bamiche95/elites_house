"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export function StripePaymentForm({
  publishableKey,
  clientSecret,
  orderNumber,
  onPaid,
}: {
  publishableKey: string;
  clientSecret: string;
  orderNumber: string;
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
      <StripeFormInner orderNumber={orderNumber} onPaid={onPaid} />
    </Elements>
  );
}

function StripeFormInner({
  orderNumber,
  onPaid,
}: {
  orderNumber: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        {submitting ? "Processing…" : "Pay securely"}
      </Button>
      <p className="text-center text-[0.65rem] leading-relaxed text-mocha">
        Payments are encrypted and processed by Stripe. Apple Pay and Google Pay appear
        automatically on supported devices.
      </p>
    </form>
  );
}

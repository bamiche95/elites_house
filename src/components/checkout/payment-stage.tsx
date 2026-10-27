"use client";

import type { PaymentMode, StartResponse } from "@/components/checkout/types";
import { PayPalPaymentButtons } from "@/components/checkout/paypal-payment-buttons";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export function PaymentStage({
  session,
  mode,
  paypalClientId,
  totalPence,
  onPaid,
  onDemoPaid,
  demoLoading,
  demoError,
}: {
  session: StartResponse;
  mode: PaymentMode;
  paypalClientId: string;
  totalPence: number;
  onPaid: () => void;
  onDemoPaid: () => void;
  demoLoading: boolean;
  demoError: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="border border-line bg-cream px-4 py-3">
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">Order reference</p>
        <p className="mt-1 font-display text-xl text-espresso">{session.orderNumber}</p>
      </div>

      {mode === "STRIPE" && session.clientSecret && session.publishableKey ? (
        <StripePaymentForm
          publishableKey={session.publishableKey}
          clientSecret={session.clientSecret}
          orderNumber={session.orderNumber}
          onPaid={onPaid}
        />
      ) : null}

      {mode === "PAYPAL" && session.paypalOrderId ? (
        <PayPalPaymentButtons
          clientId={paypalClientId}
          paypalOrderId={session.paypalOrderId}
          orderNumber={session.orderNumber}
          onPaid={onPaid}
        />
      ) : null}

      {mode === "DEMO" ? (
        <div className="space-y-4 border border-gold/40 bg-gold/10 p-5">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-gold">
              Development mode
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mocha">
              Demo payments are enabled for this environment. Place the order to exercise the
              full fulfilment flow — stock is reserved, the confirmation email is queued and
              the order appears in your account and the admin dashboard.
            </p>
          </div>
          {demoError ? (
            <p className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {demoError}
            </p>
          ) : null}
          <Button onClick={onDemoPaid} size="lg" className="w-full" disabled={demoLoading}>
            {demoLoading ? "Placing order…" : "Place test order"}
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">Total due</span>
        <span className="text-lg text-espresso">{formatMoney(totalPence)}</span>
      </div>
    </div>
  );
}

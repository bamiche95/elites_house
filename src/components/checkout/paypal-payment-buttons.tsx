"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";

export function PayPalPaymentButtons({
  clientId,
  paypalOrderId,
  orderNumber,
  onPaid,
}: {
  clientId: string;
  paypalOrderId: string;
  orderNumber: string;
  onPaid: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PayPalScriptProvider
        options={{
          clientId,
          currency: "GBP",
          intent: "capture",
          components: "buttons",
        }}
      >
        <PayPalButtons
          forceReRender={[paypalOrderId]}
          style={{ layout: "vertical", color: "black", shape: "rect", label: "paypal" }}
          createOrder={async () => paypalOrderId}
          onApprove={async () => {
            try {
              const response = await fetch("/api/checkout/paypal-capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderNumber, paypalOrderId }),
              });
              const data = (await response.json()) as { error?: string };
              if (!response.ok) throw new Error(data.error ?? "PayPal capture failed");
              onPaid();
            } catch (captureError) {
              setError(
                captureError instanceof Error
                  ? captureError.message
                  : "We couldn't confirm your PayPal payment.",
              );
            }
          }}
          onError={() => setError("PayPal could not complete the payment. Please try again.")}
        />
      </PayPalScriptProvider>
      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <p className="text-center text-[0.65rem] leading-relaxed text-mocha">
        You&apos;ll be taken to PayPal to approve the payment, then returned here.
      </p>
    </div>
  );
}

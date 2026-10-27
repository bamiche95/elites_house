"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StripeConfirm({ paymentIntentId }: { paymentIntentId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "done" | "error">("checking");

  useEffect(() => {
    let active = true;

    async function confirm() {
      try {
        const response = await fetch("/api/checkout/stripe-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        if (!response.ok) throw new Error("confirm failed");
        if (active) {
          setStatus("done");
          router.refresh();
        }
      } catch {
        if (active) setStatus("error");
      }
    }

    confirm();
    return () => {
      active = false;
    };
  }, [paymentIntentId, router]);

  return (
    <p className="text-[0.68rem] uppercase tracking-[0.14em] text-mocha">
      {status === "checking"
        ? "Confirming your payment with Stripe…"
        : status === "done"
          ? "Payment verified."
          : "We couldn't verify the payment automatically — it will update as soon as Stripe notifies us."}
    </p>
  );
}

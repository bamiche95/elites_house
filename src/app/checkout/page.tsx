import type { Metadata } from "next";
import { Lock, Shield, Truck } from "lucide-react";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getSessionUser } from "@/lib/auth-helpers";
import { env, paymentMethods } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Secure checkout",
  description: "Complete your LushTresses order securely with Stripe or PayPal.",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const address = user
    ? await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : null;

  return (
    <>
      <section className="border-b border-line bg-cream py-10">
        <div className="container-luxe">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-3 font-display text-4xl text-espresso sm:text-5xl">
            Almost yours
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.66rem] uppercase tracking-[0.16em] text-mocha">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-gold" /> Secure checkout
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-gold" /> Free UK delivery over £150
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-gold" /> 30-day returns
            </span>
          </div>
        </div>
      </section>

      <div className="container-luxe py-10 lg:py-14">
        <CheckoutFlow
          initialEmail={user?.email ?? ""}
          initialName={user?.name ?? address?.fullName ?? ""}
          initialPhone={user?.phone ?? address?.phone ?? ""}
          initialAddress={
            address
              ? {
                  fullName: address.fullName,
                  phone: address.phone,
                  line1: address.line1,
                  line2: address.line2 ?? "",
                  city: address.city,
                  county: address.county ?? "",
                  postcode: address.postcode,
                  country: address.country,
                }
              : null
          }
          methods={paymentMethods}
          stripePublishableKey={env.stripePublishableKey}
          paypalClientId={env.paypalClientId}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </>
  );
}

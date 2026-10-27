import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Your bag",
  description: "Review the pieces in your LushTresses bag before checkout.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="container-luxe py-10 lg:py-14">
      <Breadcrumbs items={[{ label: "Your bag" }]} />
      <h1 className="mt-6 font-display text-4xl text-espresso sm:text-5xl">Your bag</h1>
      <p className="mt-2 text-sm text-mocha">
        Items are reserved only once payment is confirmed at checkout.
      </p>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}

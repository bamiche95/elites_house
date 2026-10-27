import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "You're offline",
  description: "The LushTresses app is offline. Reconnect to keep browsing.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="container-luxe py-24 text-center">
      <p className="eyebrow">Offline</p>
      <h1 className="mt-3 font-display text-4xl text-espresso sm:text-5xl">
        You&apos;re offline
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mocha">
        We&apos;ve saved the pages you&apos;ve already visited. Reconnect to browse the full
        collection, check stock and complete checkout.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Try again</ButtonLink>
        <ButtonLink href="/shop" variant="outline">
          Shop the collection
        </ButtonLink>
      </div>
      <p className="mt-8 text-xs text-mocha">
        Your bag is saved on this device —{" "}
        <Link href="/cart" className="underline underline-offset-2">
          view your bag
        </Link>
        .
      </p>
    </div>
  );
}

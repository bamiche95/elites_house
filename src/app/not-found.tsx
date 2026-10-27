import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-luxe py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-4xl text-espresso sm:text-5xl">
        This page has been swept up
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mocha">
        The page you were looking for isn&apos;t here. It may have moved, or the link may be out
        of date.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop">Shop the collection</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
      <p className="mt-8 text-xs text-mocha">
        Looking for an order?{" "}
        <Link href="/account/orders" className="underline underline-offset-2">
          View your orders
        </Link>
        .
      </p>
    </div>
  );
}

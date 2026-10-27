"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { FREE_SHIPPING_THRESHOLD_PENCE, SHIPPING_METHODS } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = items.reduce((total, line) => total + line.pricePence * line.quantity, 0);
  const savings = items.reduce(
    (total, line) =>
      total +
      (line.compareAtPricePence
        ? Math.max(0, line.compareAtPricePence - line.pricePence) * line.quantity
        : 0),
    0,
  );
  const standardShipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_PENCE ? 0 : SHIPPING_METHODS[0].pricePence;

  if (!hydrated) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-cream" />
        <div className="h-24 bg-cream" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line bg-cream px-6 py-20 text-center">
        <p className="font-display text-3xl text-espresso">Your bag is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">
          Start with a bundle, or explore our glueless HD lace wigs for an effortless
          install.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop">Shop all hair</ButtonLink>
          <ButtonLink href="/shop/wigs" variant="outline">
            Shop wigs
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
      <div>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((line) => (
            <li key={line.variantId} className="flex gap-4 py-5 sm:gap-6">
              <Link
                href={`/product/${line.productSlug}`}
                className="relative h-32 w-24 shrink-0 overflow-hidden bg-cream sm:h-36 sm:w-28"
              >
                <Image
                  src={line.imageUrl}
                  alt={line.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.productSlug}`}
                      className="font-display text-xl leading-tight text-espresso hover:text-gold"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-mocha">
                      {line.variantLabel}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-mocha/70">SKU {line.sku}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.variantId)}
                    aria-label={`Remove ${line.name}`}
                    className="text-mocha transition-colors hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center text-mocha hover:text-espresso"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-xs">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                      aria-label="Increase quantity"
                      disabled={line.quantity >= Math.min(line.stock, 10)}
                      className="flex h-9 w-9 items-center justify-center text-mocha hover:text-espresso disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-espresso">
                      {formatMoney(line.pricePence * line.quantity)}
                    </p>
                    {line.compareAtPricePence ? (
                      <p className="text-xs text-mocha/60 line-through">
                        {formatMoney(line.compareAtPricePence * line.quantity)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.18em] text-espresso hover:text-gold"
          >
            Continue shopping
          </Link>
          <p className="text-xs text-mocha">
            {subtotal >= FREE_SHIPPING_THRESHOLD_PENCE
              ? "Free tracked UK delivery applied."
              : `Add ${formatMoney(FREE_SHIPPING_THRESHOLD_PENCE - subtotal)} for free UK delivery.`}
          </p>
        </div>
      </div>

      <aside className="h-fit border border-line bg-cream p-6">
        <h2 className="font-display text-2xl text-espresso">Order summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between text-mocha">
            <dt>Subtotal</dt>
            <dd className="text-espresso">{formatMoney(subtotal)}</dd>
          </div>
          {savings > 0 ? (
            <div className="flex justify-between text-success">
              <dt>You save</dt>
              <dd>−{formatMoney(savings)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-mocha">
            <dt>Standard delivery</dt>
            <dd className="text-espresso">
              {standardShipping === 0 ? "Free" : formatMoney(standardShipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="uppercase tracking-[0.14em] text-mocha">Total</dt>
            <dd className="text-espresso">{formatMoney(subtotal + standardShipping)}</dd>
          </div>
        </dl>

        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          Checkout <ArrowRight className="h-4 w-4" />
        </ButtonLink>

        <ul className="mt-5 space-y-2 text-[0.68rem] leading-relaxed text-mocha">
          <li>Secure checkout with Stripe &amp; PayPal</li>
          <li>30-day returns on unworn hair</li>
          <li>Packed by hand in our London atelier</li>
        </ul>
      </aside>
    </div>
  );
}

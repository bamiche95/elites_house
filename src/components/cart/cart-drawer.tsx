"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Overlay } from "@/components/ui/overlay";
import { selectCartCount, useCartStore } from "@/lib/cart-store";
import { FREE_SHIPPING_THRESHOLD_PENCE } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export function CartDrawer() {
  const open = useCartStore((state) => state.drawerOpen);
  const close = useCartStore((state) => state.closeDrawer);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = useCartStore(selectCartCount);

  const subtotal = items.reduce((total, line) => total + line.pricePence * line.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_PENCE - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD_PENCE) * 100));

  return (
    <Overlay open={open} onClose={close} title={`Your bag (${count})`} variant="drawer-right">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-mocha">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-2xl text-espresso">Your bag is empty</p>
              <p className="mt-1 text-sm text-mocha">
                Begin with a bundle — they&apos;re the heart of every install.
              </p>
            </div>
            <ButtonLink href="/shop" onClick={close} variant="primary" size="md">
              Shop the collection
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="mb-5 border border-line bg-cream px-4 py-3">
              <p className="flex items-center gap-2 text-xs text-mocha">
                <Truck className="h-4 w-4 text-gold" />
                {remainingForFreeShipping === 0
                  ? "Free tracked UK delivery unlocked."
                  : `Add ${formatMoney(remainingForFreeShipping)} for free UK delivery.`}
              </p>
              <div className="mt-2 h-1 w-full bg-sand">
                <div className="h-1 bg-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="divide-y divide-line">
              {items.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-4">
                  <Link
                    href={`/product/${line.productSlug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden bg-cream"
                  >
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${line.productSlug}`}
                          onClick={close}
                          className="block truncate font-display text-lg leading-tight text-espresso"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-mocha">{line.variantLabel}</p>
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

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="flex h-8 w-8 items-center justify-center text-mocha hover:text-espresso"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                          aria-label="Increase quantity"
                          disabled={line.quantity >= Math.min(line.stock, 10)}
                          className="flex h-8 w-8 items-center justify-center text-mocha hover:text-espresso disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm text-espresso">
                        {formatMoney(line.pricePence * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {items.length > 0 ? (
        <div className="border-t border-line px-5 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="uppercase tracking-[0.16em] text-mocha">Subtotal</span>
            <span className="text-lg text-espresso">{formatMoney(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-mocha">
            Shipping and discounts calculated at checkout.
          </p>
          <div className="mt-4 grid gap-2">
            <ButtonLink href="/checkout" onClick={close} size="lg" className="w-full">
              Checkout
            </ButtonLink>
            <ButtonLink
              href="/cart"
              onClick={close}
              variant="outline"
              size="md"
              className="w-full"
            >
              View bag
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </Overlay>
  );
}

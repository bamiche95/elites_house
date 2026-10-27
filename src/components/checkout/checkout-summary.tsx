"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import type { CartItem } from "@/lib/cart-store";
import { formatMoney } from "@/lib/utils";

export function CheckoutSummary({
  items,
  subtotalPence,
  discountPence,
  shippingPence,
  totalPence,
  couponCode,
  couponMessage,
  couponError,
  couponInput,
  onCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  applying,
}: {
  items: CartItem[];
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  totalPence: number;
  couponCode?: string;
  couponMessage?: string;
  couponError?: string | null;
  couponInput: string;
  onCouponInput: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  applying: boolean;
}) {
  return (
    <aside className="h-fit border border-line bg-cream p-6">
      <h2 className="font-display text-2xl text-espresso">Your order</h2>

      <ul className="mt-5 space-y-4">
        {items.map((line) => (
          <li key={line.variantId} className="flex gap-3">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
              <Image
                src={line.imageUrl}
                alt={line.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${line.productSlug}`}
                className="block truncate text-sm text-espresso hover:text-gold"
              >
                {line.name}
              </Link>
              <p className="text-[0.65rem] uppercase tracking-[0.1em] text-mocha">
                {line.variantLabel} × {line.quantity}
              </p>
            </div>
            <span className="shrink-0 text-sm text-espresso">
              {formatMoney(line.pricePence * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-line pt-4">
        {couponCode ? (
          <div className="flex items-start justify-between gap-3 border border-success/30 bg-success/5 px-3 py-2">
            <div>
              <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-success">
                <Tag className="h-3 w-3" /> {couponCode}
              </p>
              <p className="mt-0.5 text-xs text-mocha">{couponMessage}</p>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              aria-label="Remove discount code"
              className="text-mocha hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <label
              htmlFor="coupon"
              className="mb-2 block text-[0.62rem] uppercase tracking-[0.18em] text-mocha"
            >
              Discount code
            </label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={couponInput}
                onChange={(event) => onCouponInput(event.target.value.toUpperCase())}
                placeholder="WELCOME10"
                className="h-11 flex-1 uppercase"
              />
              <Button
                type="button"
                onClick={onApplyCoupon}
                variant="outline"
                className="h-11 shrink-0"
                disabled={applying || couponInput.trim().length < 2}
              >
                {applying ? "…" : "Apply"}
              </Button>
            </div>
            {couponError ? <p className="mt-1.5 text-xs text-danger">{couponError}</p> : null}
          </div>
        )}
      </div>

      <dl className="mt-6 space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-mocha">
          <dt>Subtotal</dt>
          <dd className="text-espresso">{formatMoney(subtotalPence)}</dd>
        </div>
        {discountPence > 0 ? (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd>−{formatMoney(discountPence)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-mocha">
          <dt>Delivery</dt>
          <dd className="text-espresso">
            {shippingPence === 0 ? "Free" : formatMoney(shippingPence)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt className="uppercase tracking-[0.14em] text-mocha">Total</dt>
          <dd className="text-espresso">{formatMoney(totalPence)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-[0.65rem] leading-relaxed text-mocha">
        Prices include VAT where applicable. You&apos;ll receive an email confirmation as soon
        as payment clears.
      </p>
    </aside>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useToast } from "@/components/ui/toast";
import { useCartStore } from "@/lib/cart-store";
import {
  FREE_SHIPPING_THRESHOLD_PENCE,
  LOW_STOCK_THRESHOLD,
  MAX_QTY_PER_LINE,
} from "@/lib/constants";
import { cn, formatMoney } from "@/lib/utils";

export type PurchaseVariant = {
  id: string;
  label: string;
  pricePence: number;
  compareAtPricePence: number | null;
  stock: number;
  sku: string;
};

export function ProductPurchasePanel({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    variants: PurchaseVariant[];
  };
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  const initial = useMemo(
    () => product.variants.find((variant) => variant.stock > 0) ?? product.variants[0],
    [product.variants],
  );
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = product.variants.find((variant) => variant.id === selectedId) ?? initial;
  const maxQuantity = selected ? Math.max(1, Math.min(selected.stock, MAX_QTY_PER_LINE)) : 1;
  const soldOut = !selected || selected.stock <= 0;
  const lowStock = Boolean(
    selected && selected.stock > 0 && selected.stock <= LOW_STOCK_THRESHOLD,
  );

  const add = () => {
    if (!selected || soldOut) return;
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        variantLabel: selected.label,
        sku: selected.sku,
        imageUrl: product.imageUrl,
        pricePence: selected.pricePence,
        compareAtPricePence: selected.compareAtPricePence,
        stock: selected.stock,
        quantity: 1,
      },
      quantity,
    );
  };

  const onAddToBag = () => {
    add();
    toast({
      title: "Added to your bag",
      description: `${product.name} — ${selected?.label} × ${quantity}`,
    });
  };

  const onBuyNow = () => {
    add();
    router.push("/checkout");
  };

  return (
    <div className="space-y-6">
      {selected ? (
        <Price
          pence={selected.pricePence}
          compareAtPence={selected.compareAtPricePence}
          size="lg"
        />
      ) : null}

      <fieldset>
        <legend className="mb-3 text-[0.62rem] uppercase tracking-[0.2em] text-mocha">
          Choose your option
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {product.variants.map((variant) => {
            const active = variant.id === selectedId;
            const disabled = variant.stock <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectedId(variant.id);
                  setQuantity(1);
                }}
                aria-pressed={active}
                className={cn(
                  "border px-3 py-2.5 text-left text-[0.68rem] uppercase tracking-[0.1em] transition-colors",
                  active
                    ? "border-ink bg-ink text-ivory"
                    : "border-line text-espresso hover:border-ink",
                  disabled && "cursor-not-allowed border-line/60 text-mocha/40 line-through",
                )}
              >
                <span className="block">{variant.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[0.62rem] tracking-normal",
                    active ? "text-ivory/70" : "text-mocha",
                  )}
                >
                  {formatMoney(variant.pricePence)}
                  {disabled ? " · sold out" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-mocha hover:text-espresso disabled:opacity-40"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center text-mocha hover:text-espresso disabled:opacity-40"
            disabled={quantity >= maxQuantity || soldOut}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-mocha">
          {soldOut ? (
            <span className="text-danger">Sold out — check back soon.</span>
          ) : lowStock ? (
            <span className="text-danger">Only {selected?.stock} left in the atelier.</span>
          ) : (
            <>In stock · dispatched within one working day</>
          )}
        </p>
      </div>

      <div className="grid gap-2">
        <Button onClick={onAddToBag} disabled={soldOut} size="lg" className="w-full">
          <ShoppingBag className="h-4 w-4" />
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
        <Button
          onClick={onBuyNow}
          disabled={soldOut}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Buy it now
        </Button>
      </div>

      <p className="flex items-center gap-2 border-t border-line pt-4 text-xs text-mocha">
        <Truck className="h-4 w-4 text-gold" />
        Free UK delivery over {formatMoney(FREE_SHIPPING_THRESHOLD_PENCE)} · 30-day returns
      </p>
    </div>
  );
}


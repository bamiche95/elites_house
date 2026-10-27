"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { MAX_QTY_PER_LINE } from "@/lib/constants";

export type CartItem = {
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  variantLabel: string;
  sku: string;
  imageUrl: string;
  pricePence: number;
  compareAtPricePence?: number | null;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  hydrated: boolean;
  addItem: (item: CartItem, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setHydrated: (value: boolean) => void;
};

const clampQuantity = (quantity: number, stock: number) => {
  const ceiling = Math.max(0, Math.min(stock, MAX_QTY_PER_LINE));
  return Math.max(1, Math.min(quantity, ceiling || 1));
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      hydrated: false,

      addItem: (item, quantity = 1) => {
        const items = get().items;
        const existing = items.find((line) => line.variantId === item.variantId);
        const nextQuantity = clampQuantity(
          (existing?.quantity ?? 0) + quantity,
          item.stock,
        );

        const nextItems = existing
          ? items.map((line) =>
              line.variantId === item.variantId
                ? { ...line, ...item, quantity: nextQuantity }
                : line,
            )
          : [...items, { ...item, quantity: nextQuantity }];

        set({ items: nextItems, drawerOpen: true });
      },

      updateQuantity: (variantId, quantity) => {
        const items = get().items;
        if (quantity <= 0) {
          set({ items: items.filter((line) => line.variantId !== variantId) });
          return;
        }
        set({
          items: items.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: clampQuantity(quantity, line.stock) }
              : line,
          ),
        });
      },

      removeItem: (variantId) =>
        set({
          items: get().items.filter((line) => line.variantId !== variantId),
        }),

      clear: () => set({ items: [], drawerOpen: false }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "lust-cart-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((total, line) => total + line.quantity, 0);

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((total, line) => total + line.pricePence * line.quantity, 0);

/** Payload shape accepted by /api/cart/validate and the checkout routes. */
export function cartPayload() {
  return useCartStore.getState().items.map(({ variantId, quantity }) => ({
    variantId,
    quantity,
  }));
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/ui/overlay";
import { LENGTH_OPTIONS, TEXTURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PRICE_BANDS = [
  { label: "Under £100", min: undefined as number | undefined, max: 9999 as number | undefined },
  { label: "£100 – £200", min: 10000, max: 20000 },
  { label: "£200 – £350", min: 20000, max: 35000 },
  { label: "£350+", min: 35000, max: undefined },
];

const chip = (active: boolean) =>
  cn(
    "border px-3 py-2 text-[0.66rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-ink bg-ink text-ivory"
      : "border-line bg-transparent text-mocha hover:border-ink hover:text-espresso",
  );

export function ShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const current = (key: string) => searchParams.get(key) ?? undefined;

  const update = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) next.set("q", q);
    const sort = searchParams.get("sort");
    if (sort) next.set("sort", sort);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setOpen(false);
  };

  const activeCount = ["texture", "length", "minPrice", "maxPrice"].filter((key) =>
    searchParams.get(key),
  ).length;

  const panel = (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-espresso">
          Refine
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-[0.6rem] uppercase tracking-[0.16em] text-mocha underline underline-offset-4 hover:text-espresso"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-3 text-[0.62rem] uppercase tracking-[0.2em] text-mocha">
          Texture
        </legend>
        <div className="flex flex-wrap gap-2">
          {TEXTURES.map((texture) => (
            <button
              key={texture.value}
              type="button"
              onClick={() =>
                update({
                  texture: current("texture") === texture.value ? undefined : texture.value,
                })
              }
              aria-pressed={current("texture") === texture.value}
              className={chip(current("texture") === texture.value)}
            >
              {texture.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[0.62rem] uppercase tracking-[0.2em] text-mocha">
          Length
        </legend>
        <div className="flex flex-wrap gap-2">
          {LENGTH_OPTIONS.map((length) => {
            const value = String(length);
            return (
              <button
                key={length}
                type="button"
                onClick={() =>
                  update({ length: current("length") === value ? undefined : value })
                }
                aria-pressed={current("length") === value}
                className={cn(chip(current("length") === value), "min-w-12")}
              >
                {length}&quot;
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[0.62rem] uppercase tracking-[0.2em] text-mocha">
          Price
        </legend>
        <div className="flex flex-col gap-2">
          {PRICE_BANDS.map((band) => {
            const active =
              current("minPrice") === (band.min ? String(band.min) : undefined) &&
              current("maxPrice") === (band.max ? String(band.max) : undefined);
            return (
              <button
                key={band.label}
                type="button"
                onClick={() =>
                  update({
                    minPrice: active ? undefined : band.min ? String(band.min) : undefined,
                    maxPrice: active ? undefined : band.max ? String(band.max) : undefined,
                  })
                }
                aria-pressed={active}
                className={cn(chip(active), "text-left")}
              >
                {band.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 border border-line px-4 py-3 text-[0.66rem] uppercase tracking-[0.16em] text-espresso lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.6rem] text-ink">
            {activeCount}
          </span>
        ) : null}
      </button>

      <div className="hidden lg:block">{panel}</div>

      <Overlay open={open} onClose={() => setOpen(false)} title="Filters" variant="drawer-right">
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {panel}
          <Button onClick={() => setOpen(false)} className="mt-8 w-full">
            Show results
          </Button>
        </div>
      </Overlay>
    </>
  );
}

